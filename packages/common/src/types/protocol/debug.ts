import type { EAlienType, EPhase } from '@seti/common/types/protocol/enums';

export interface IDebugAuthUser {
  id: string;
  name: string;
  email: string;
}

export interface IDebugServerSessionResponse {
  gameId: string;
  accessToken: string;
  user: IDebugAuthUser;
}

export interface IDebugReplayFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type TDebugReplayFieldKind =
  | 'select'
  | 'text'
  | 'number'
  | 'player'
  | 'card';

interface IDebugReplayFieldDefinitionBase {
  id: string;
  label: string;
  required: boolean;
}

export interface IDebugReplaySelectFieldDefinition
  extends IDebugReplayFieldDefinitionBase {
  kind: 'select';
  options: IDebugReplayFieldOption[];
}

export interface IDebugReplayTextFieldDefinition
  extends IDebugReplayFieldDefinitionBase {
  kind: Exclude<TDebugReplayFieldKind, 'select'>;
  defaultValue?: string;
  placeholder?: string;
}

export type IDebugReplayFieldDefinition =
  | IDebugReplaySelectFieldDefinition
  | IDebugReplayTextFieldDefinition;

export interface IDebugReplayCheckpointDefinition {
  id: string;
  label: string;
  description: string;
}

export interface IDebugReplayPresetDefinition {
  id: string;
  label: string;
  description: string;
  fields: IDebugReplayFieldDefinition[];
  checkpoints: IDebugReplayCheckpointDefinition[];
}

export interface IDebugReplaySessionRequest {
  presetId: string;
  checkpointId: string;
  fieldValues: Record<string, string>;
}

export interface IDebugReplaySessionMetadata {
  presetId: string;
  checkpointId: string;
  currentPlayerId: string;
  phase: EPhase;
  summary: string;
  alienIndex: number;
  selectedAlienType: EAlienType;
}

export interface IDebugReplaySessionResponse
  extends IDebugServerSessionResponse {
  replay: IDebugReplaySessionMetadata;
}

export interface IDebugSnapshotSessionRequest {
  gameId: string;
  version?: number;
  viewerPlayerId?: string;
}

export interface IDebugSnapshotSessionResponse
  extends IDebugServerSessionResponse {
  sourceGameId: string;
  snapshotVersion: number;
  phase: EPhase;
  round: number;
}
