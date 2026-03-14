export async function runSftpImporter(input: {
  host: string;
  remotePath: string;
}) {
  return {
    status: "queued" as const,
    detail: `SFTP pull queued for ${input.host}:${input.remotePath}`
  };
}
