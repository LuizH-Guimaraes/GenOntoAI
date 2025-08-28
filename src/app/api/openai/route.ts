import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { pool } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

const MODEL = "gpt-3.5-turbo";
const MAX_TOKENS = 2000;

export async function POST(req: Request) {
  // const data = {
  //   choices: [
  //     {
  //       message: {
  //         content: [
  //           "Ferret | is a type of | domesticated species",
  //           "Ferret | belongs to | Mustelidae",
  //           "Ferret | is a type of | European polecat",
  //           "Ferret | interbreeds with | European polecats",
  //           "Ferret | resembles | other mustelids",
  //           "Ferret | weighs | between 0.7 and 2.0 kg",
  //           "Ferret | has | black, brown, or white fur",
  //           "Males | are | considerably larger than females",
  //           "Ferret | was bred for | hunting rabbits",
  //           "Ferret | has become | a prominent household pet in North America",
  //           "Ferret | contributed to | research in neuroscience and infectious disease",
  //           "Ferret | is derived from | the Latin word 'furittus'",
  //           "Ferret | was called | mearþ in Old English",
  //           "Male ferret | is called | a hob",
  //           "Female ferret | is called | a jill",
  //         ].join("\n"), // simula a string retornada pela OpenAI
  //       },
  //     },
  //   ],
  // };

  // const completion = data.choices?.[0]?.message?.content || "";

  // const svoList = completion
  //   .split("\n")
  //   .map((line: string) => line.replace(/^- /, "").trim())
  //   .filter((line: string) => line.includes("|"));

  // return NextResponse.json({ svoList });

  try {
    const session = await auth0.getSession();
    if (!session?.user?.sub)
      return new NextResponse("Unauthorized", { status: 401 });

    const auth0_id = session.user.sub;

    const { text } = await req.json();
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Invalid text" }, { status: 400 });
    }

    // 🔐 Buscar a chave criptografada no banco
    const userResult = await pool.query(
      "SELECT id FROM users WHERE auth0_id = $1",
      [auth0_id]
    );
    const user = userResult.rows[0];
    if (!user) return new NextResponse("User not found", { status: 404 });

    const keyResult = await pool.query(
      "SELECT key FROM keys WHERE user_id = $1",
      [user.id]
    );

    const encryptedKey = keyResult.rows[0]?.key;
    if (!encryptedKey) {
      return NextResponse.json(
        { error: "No API key found for this user" },
        { status: 400 }
      );
    }

    const API_KEY = decrypt(encryptedKey, auth0_id); // ✅ usar o mesmo método

    // console.log(API_KEY);
    // return NextResponse.json([]);

    // 🧠 Prompt
    const prompt = `
You are an expert linguistic analyzer tasked with extracting rich, structured knowledge from text. Your goal is to extract **Subject-Predicate-Object (SPO)** triples that can be used to construct a high-quality **ontological knowledge graph**.

📌 Your output must:
- Use only meaningful, **semantic predicates** (e.g., "is a type of", "belongs to", "requires", "is located in", "was discovered by", "contains", "is made of").
- Disambiguate and **expand** pronouns (e.g., "it", "they") using context.
- Normalize proper names, dates, categories, and compound phrases for consistency.
- Break complex ideas into multiple smaller SPO triples when appropriate.
- Ignore non-informative or vague sentences.
- Always format the result as:
  **Subject | Predicate | Object**

📚 Additional Instructions:
- Fix formatting or grammar issues in the input if needed.
- Ignore irrelevant or speculative statements.
- Infer hidden relationships when logically clear from the context.
- Avoid generic predicates like "is", unless further clarified.
- Avoid unnecessary adjectives unless part of a named entity (e.g., "European polecat").

💡 Example Input:
"The ferret is a small, domesticated species in the family Mustelidae. It is likely a type of European polecat."

✅ Example Output:
- Ferret | is a type of | domesticated species  
- Ferret | belongs to | Mustelidae  
- Ferret | is a type of | European polecat (likely)

---

Now extract the SPO triples from the following text:

""" 
${text}
"""

Respond ONLY with one SPO triple per line in this format:
Subject | Predicate | Object
`.trim();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: MAX_TOKENS,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "OpenAI API error" },
        { status: response.status }
      );
    }

    const data = await response.json();

    const completion = data.choices?.[0]?.message?.content || "";

    const svoList = completion
      .split("\n")
      .map((line: string) => line.replace(/^- /, "").trim())
      .filter((line: string) => line.includes("|"));

    return NextResponse.json({ svoList });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
