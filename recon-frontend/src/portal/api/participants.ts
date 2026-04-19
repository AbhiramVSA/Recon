import { apiFetch } from './client';

export interface BackendParticipant {
    id: string;
    user_id: string;
    display_name: string;
    institution: string;
    year: number;
    linkedin_acc?: string | null;
    github_acc?: string | null;
    x_acc?: string | null;
    phone?: string | null;
    profile_photo_file_key?: string | null;
    talent_visible: boolean;
    talent_contact_shareable: boolean;
    checked_in_at?: string | null;
    checked_in_by?: string | null;
    created_at: string;
    can_edit?: boolean;
    is_self?: boolean;
}

export async function fetchMyParticipantProfile() {
    return apiFetch<BackendParticipant>('/api/v1/participants/me');
}

export interface CreateParticipantPayload {
    display_name: string;
    institution: string;
    year: number;
    linkedin_acc?: string | null;
    github_acc?: string | null;
    x_acc?: string | null;
    phone?: string | null;
    profile_photo_file_key?: string | null;
    talent_visible?: boolean;
    talent_contact_shareable?: boolean;
}

export async function createMyParticipantProfile(payload: CreateParticipantPayload) {
    return apiFetch<BackendParticipant>('/api/v1/participants/me', {
        method: 'POST',
        json: payload,
    });
}

export type UpdateParticipantPayload = Partial<CreateParticipantPayload>;

export async function updateMyParticipantProfile(payload: UpdateParticipantPayload) {
    return apiFetch<BackendParticipant>('/api/v1/participants/me', {
        method: 'PATCH',
        json: payload,
    });
}

export interface TalentVisibilityPayload {
    talent_visible?: boolean;
    talent_contact_shareable?: boolean;
}

export async function updateMyTalentVisibility(payload: TalentVisibilityPayload) {
    return apiFetch<BackendParticipant>('/api/v1/participants/me/talent-visibility', {
        method: 'PATCH',
        json: payload,
    });
}

