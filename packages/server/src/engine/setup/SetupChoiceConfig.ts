import type {
  ESetupChoiceStepKind,
  ISetupChoiceCandidate,
} from '@seti/common/types/protocol/playerInput';

export interface ISetupChoicePermission {
  canChoose: boolean;
  reason?: string;
}

export interface ISetupChoiceCandidateConfig {
  id: string;
  label: string;
  permission?: ISetupChoicePermission;
}

export interface ISetupChoiceStepConfig {
  kind: ESetupChoiceStepKind;
  title: string;
  enabled: boolean;
  minSelections: number;
  maxSelections: number;
  candidates: ISetupChoiceCandidateConfig[];
  permission?: ISetupChoicePermission;
  autoSelect?: 'none' | 'single-candidate';
}

export interface ISetupChoiceConfig {
  steps: ISetupChoiceStepConfig[];
}

export const DEFAULT_SETUP_CHOICE_CONFIG: Readonly<ISetupChoiceConfig> =
  Object.freeze({
    steps: [],
  });

export function toSetupChoiceCandidate(
  candidate: ISetupChoiceCandidateConfig,
): ISetupChoiceCandidate {
  return {
    id: candidate.id,
    label: candidate.label,
    canChoose: candidate.permission?.canChoose ?? true,
    disabledReason: candidate.permission?.reason,
  };
}
