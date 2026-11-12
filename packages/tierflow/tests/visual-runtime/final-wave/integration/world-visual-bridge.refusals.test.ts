/// <reference types="bun-types" />
import { test, expect } from 'bun:test';
import { contentHash, canonicalJson } from '../../../../src/ui/hash.ts';
import { parseUiDocument } from '../../../../src/ui/world.ts';
import { projectWorldRevision } from '../../../../src/visual-runtime/final-wave/integration/world-visual-bridge.ts';
import type { UiDocument, UiRevision, UiObject } from '../../../../src/ui/types.ts';