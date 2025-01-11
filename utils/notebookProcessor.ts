interface Cell {
  type: "code" | "markdown";
  index: number;
  content: string;
}

interface NotebookContent {
  codeCells: Cell[];
  markdownCells: Cell[];
}

export function processNotebookContent(notebook: any): NotebookContent {
  const codeCells: Cell[] = [];
  const markdownCells: Cell[] = [];
  let cellIndex = 0;

  notebook.cells?.forEach((cell: any) => {
    if (cell.cell_type === "code") {
      codeCells.push({
        type: "code",
        index: cellIndex,
        content: Array.isArray(cell.source)
          ? cell.source.join("")
          : cell.source,
      });
    } else if (cell.cell_type === "markdown") {
      markdownCells.push({
        type: "markdown",
        index: cellIndex,
        content: Array.isArray(cell.source)
          ? cell.source.join("")
          : cell.source,
      });
    }
    cellIndex++;
  });

  return { codeCells, markdownCells };
}

export function generateAnalysisPrompt(cell: Cell): string {
  if (cell.type === "code") {
    return `Analyze this code cell (#${cell.index + 1}):\n\`\`\`python\n${
      cell.content
    }\n\`\`\``;
  } else {
    return `Review this markdown cell (#${cell.index + 1}):\n${cell.content}`;
  }
}

export function generatePythonScript(codeCells: Cell[]): string {
  return codeCells
    .map((cell, index) => {
      return `# Cell ${index + 1}\n${cell.content}\n`;
    })
    .join("\n");
}
