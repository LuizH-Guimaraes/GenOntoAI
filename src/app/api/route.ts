import { NextResponse } from "next/server";

export async function GET() {
  const API_KEY = process.env.API_KEY;

  console.log(API_KEY);
  return NextResponse.json({ user: "Luiz Guimaraes" });
}
//   try {
//     const API_KEY = process.env.API_KEY; // 🔑 Pegando a chave do .env
//     if (!API_KEY) {
//       return NextResponse.json(
//         { error: "API_KEY não configurada" },
//         { status: 500 }
//       );
//     }

//     // 🔥 Fazendo a requisição para a API externa
//     const response = await fetch("https://api.example.com/grafos", {
//       headers: { Authorization: `Bearer ${API_KEY}` },
//     });

//     if (!response.ok) {
//       return NextResponse.json(
//         { error: "Erro ao buscar os dados" },
//         { status: response.status }
//       );
//     }

//     const data = await response.json();
//     return NextResponse.json(data);
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Erro interno do servidor" },
//       { status: 500 }
//     );
//   }
// }
