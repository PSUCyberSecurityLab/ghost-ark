export interface PaperEvidenceManifest {
  readonly snapshot: {
    readonly recorded_source_revision: string;
    readonly tag: string | null;
    readonly tag_status: string;
  };
  readonly reproduction: {
    readonly target: string;
    readonly commands: Record<string, string>;
  };
  readonly paths: {
    readonly generated_proof_summary: string;
    readonly committed_proof_logs: ReadonlyArray<{
      readonly path: string;
      readonly sha256: string;
    }>;
  };
  readonly toolchains: {
    readonly node: {
      readonly version: string;
      readonly linux_archives: {
        readonly x64: { readonly sha256: string };
        readonly arm64: { readonly sha256: string };
      };
    };
    readonly rust: { readonly version: string };
    readonly tla: { readonly version: string; readonly sha256: string };
  };
}

export const GENERATED_PATHS: Readonly<{
  macros: string;
  paperReadme: string;
  reviewerMap: string;
}>;

export const REPLAY_COMMANDS: Readonly<Record<string, {
  readonly display: string;
  readonly executable: string;
  readonly args: readonly string[];
}>>;

export function loadManifest(): PaperEvidenceManifest;
export function generatedOutputs(manifest: PaperEvidenceManifest): Map<string, string>;
export function assertCleanTrackedWorktree(root?: string): void;
export function assertRecordedEvidenceRevision(manifest: PaperEvidenceManifest, root?: string): void;
