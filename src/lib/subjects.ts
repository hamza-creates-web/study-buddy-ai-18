import { Database, Binary, Cpu, Calculator, GitBranch } from "lucide-react";

export const subjects = [
  {
    id: "data-structures",
    name: "Data Structures",
    icon: Database,
    color: "hsl(168, 60%, 38%)",
    description: "Arrays, Linked Lists, Trees, Graphs, Hash Tables",
    topics: [
      "Arrays & Strings", "Linked Lists", "Stacks & Queues", "Trees & BST",
      "Heaps & Priority Queues", "Hash Tables", "Graphs", "Tries"
    ],
  },
  {
    id: "algorithms",
    name: "Algorithms",
    icon: GitBranch,
    color: "hsl(210, 80%, 55%)",
    description: "Sorting, Searching, Dynamic Programming, Greedy",
    topics: [
      "Sorting Algorithms", "Searching Algorithms", "Recursion & Backtracking",
      "Dynamic Programming", "Greedy Algorithms", "Divide & Conquer",
      "Graph Algorithms", "Complexity Analysis"
    ],
  },
  {
    id: "dbms",
    name: "DBMS",
    icon: Database,
    color: "hsl(38, 92%, 55%)",
    description: "SQL, Normalization, Transactions, Indexing",
    topics: [
      "ER Model & Design", "Relational Model", "SQL Queries",
      "Normalization", "Transactions & Concurrency", "Indexing",
      "Query Optimization", "NoSQL Basics"
    ],
  },
  {
    id: "os",
    name: "Operating Systems",
    icon: Cpu,
    color: "hsl(280, 55%, 55%)",
    description: "Processes, Memory, Scheduling, File Systems",
    topics: [
      "Processes & Threads", "CPU Scheduling", "Process Synchronization",
      "Deadlocks", "Memory Management", "Virtual Memory",
      "File Systems", "I/O Systems"
    ],
  },
  {
    id: "math",
    name: "Discrete Math",
    icon: Calculator,
    color: "hsl(0, 65%, 55%)",
    description: "Logic, Set Theory, Probability, Graph Theory",
    topics: [
      "Propositional Logic", "Set Theory", "Relations & Functions",
      "Combinatorics", "Probability", "Graph Theory",
      "Number Theory", "Boolean Algebra"
    ],
  },
] as const;

export type SubjectId = typeof subjects[number]["id"];
