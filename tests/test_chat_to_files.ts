import { toFiles } from '../source/engineer/chat_to_files.js';

describe('to_files tests', () => {
  function runTest(chat: string, expectedFiles: { [key: string]: string }): void {
    const workspace: any = {};
    toFiles(chat, workspace);

    expect(workspace['all_output.txt']).toBe(chat);
    for (const [file_name, file_content] of Object.entries(expectedFiles)) {
      expect(workspace[file_name]).toBe(file_content);
    }
  }

  test('to_files', () => {
    const chat = `
    This is a sample program.

    file1.py
    \`\`\`python
    print("Hello, World!")
    \`\`\`

    file2.py
    \`\`\`python
    def add(a, b):
        return a + b
    \`\`\`
    `;

    const expectedFiles = {
      'file1.py': 'print("Hello, World!")\n',
      'file2.py': 'def add(a, b):\n    return a + b\n',
      'README.md': '\nThis is a sample program.\n\nfile1.py\n',
    };

    runTest(chat, expectedFiles);
  });

  // Add other test cases here, following the same pattern as the first one

});
