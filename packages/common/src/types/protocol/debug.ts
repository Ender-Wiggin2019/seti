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

export interface IDebugReplayFieldDefinition {
  id: string;
  label: string;
  kind: 'select';
  required: boolean;
  options: IDebugReplayFieldOption[];
}

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
