interface Mapping {
  generatedLine: number;
  generatedColumn: number;
  originalLine: number;
  originalColumn: number;
  source: string;
}

export class SourceMapGenerator {
  private mappings: Mapping[] = [];
  private sources: string[] = [];
  private file: string;

  constructor(file: string) {
    this.file = file;
  }

  addSource(source: string): number {
    let idx = this.sources.indexOf(source);
    if (idx === -1) {
      idx = this.sources.length;
      this.sources.push(source);
    }
    return idx;
  }

  addMapping(mapping: Mapping) {
    this.mappings.push(mapping);
  }

  toJSON(): object {
    return {
      version: 3,
      file: this.file,
      sources: this.sources,
      mappings: this.encodeMappings(),
    };
  }

  toString(): string {
    return JSON.stringify(this.toJSON());
  }

  toComment(): string {
    const encoded = Buffer.from(this.toString()).toString('base64');
    return '//# sourceMappingURL=data:application/json;base64,' + encoded;
  }

  private encodeMappings(): string {
    const lines: string[][] = [];
    let prevGenLine = 0;

    for (const m of this.mappings) {
      while (lines.length <= m.generatedLine) lines.push([]);
      const sourceIdx = this.sources.indexOf(m.source);
      lines[m.generatedLine].push(
        this.encodeVLQ(m.generatedColumn) +
        this.encodeVLQ(sourceIdx) +
        this.encodeVLQ(m.originalLine) +
        this.encodeVLQ(m.originalColumn)
      );
    }

    return lines.map((segs) => segs.join(',')).join(';');
  }

  private encodeVLQ(value: number): string {
    const VLQ_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let vlq = value < 0 ? ((-value) << 1) + 1 : value << 1;
    let encoded = '';
    do {
      let digit = vlq & 31;
      vlq >>= 5;
      if (vlq > 0) digit |= 32;
      encoded += VLQ_CHARS[digit];
    } while (vlq > 0);
    return encoded;
  }
}
