export interface PaperNextEvidenceFinding {
  readonly id: string;
  readonly kind: string;
  readonly source: string;
  readonly anchor: string;
  readonly command: string;
  readonly values: Readonly<Record<string, string | number | boolean>>;
  readonly provenance_caveat?: string;
}

export interface PaperNextEvidenceManifest {
  readonly schema_version: "ghost-ark.paper-next-evidence.v1";
  readonly paper: {
    readonly title: string;
    readonly question: string;
    readonly non_claim: string;
  };
  readonly frozen_inputs: {
    readonly evidence_tag: string;
    readonly evidence_revision: string;
    readonly release_tag: string;
    readonly release_revision: string;
  };
  readonly raw_evidence_boundary: {
    readonly status: string;
    readonly statement: string;
  };
  readonly findings: ReadonlyArray<PaperNextEvidenceFinding>;
  readonly figures: ReadonlyArray<{
    readonly path: string;
    readonly finding_ids: ReadonlyArray<string>;
    readonly kind: string;
  }>;
  readonly required_citation_keys: ReadonlyArray<string>;
}

export function loadManifest(): PaperNextEvidenceManifest;
export function renderMacros(manifest: PaperNextEvidenceManifest): string;
export function check(): PaperNextEvidenceManifest;
export function main(args?: string[]): number;
