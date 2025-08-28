"use client";

import React from "react";

export function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-gray-800">
      <h1 className="text-4xl font-bold mb-6 text-center">About Us</h1>

      <p className="text-lg mb-4">
        This project is part of an academic research initiative in the field of{" "}
        <strong>Computer Science</strong>, focused on the automated construction
        of <strong>ontological graphs</strong> through the use of{" "}
        <strong>Artificial Intelligence</strong>.
      </p>

      <p className="text-lg mb-4">
        Our goal is to help researchers, students, and developers extract and
        organize knowledge from unstructured text sources using modern AI
        techniques such as <strong>Large Language Models (LLMs)</strong>,
        semantic similarity, and relationship classification.
      </p>

      <p className="text-lg mb-4">
        The system is built to be <strong>open source</strong>, modular, and
        extensible — encouraging collaboration from the academic and open-source
        communities.
      </p>

      <p className="text-lg mb-4">
        It features a user-friendly interface for exploring ontological
        structures, editing relationships, and exporting data for integration
        with existing knowledge systems or Semantic Web tools.
      </p>

      <p className="text-lg mb-4">
        We believe that democratizing access to ontology building tools powered
        by AI can advance fields like education, data science, and knowledge
        management.
      </p>

      <p className="text-lg mt-10 text-center italic">
        Together, let's shape the future of intelligent knowledge
        representation.
      </p>
    </div>
  );
}
