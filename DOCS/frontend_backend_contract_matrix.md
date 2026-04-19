# Frontend/Backend Contract Matrix

Status legend:
- `Used` means a real frontend flow consumes the endpoint.
- `New UI` means this pass surfaced a previously missing backend capability.
- `Intentional` means the endpoint is implemented but not exposed in the current product because another canonical route or internal ops tooling covers the same concern.

## Auth + Users

| Method | Endpoint | Schemas | Auth | Frontend consumer | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/auth/google/login` | redirect | public | [LoginPage](../Recon/src/portal/pages/LoginPage.tsx) | Used |
| `GET` | `/api/v1/auth/google/callback` | cookie session redirect | OAuth callback | [AuthCallbackPage](../Recon/src/portal/pages/AuthCallbackPage.tsx) | Used |
| `GET` | `/api/v1/auth/me` | `UserProfile` | authenticated | [authStore](../Recon/src/portal/stores/authStore.ts) | Used |
| `POST` | `/api/v1/auth/refresh` | none -> status | authenticated refresh cookie | [SettingsPage](../Recon/src/portal/pages/SettingsPage.tsx) | Used |
| `POST` | `/api/v1/auth/logout` | none -> status | authenticated | [authStore](../Recon/src/portal/stores/authStore.ts) | Used |
| `POST` | `/api/v1/users/` | `UserCreate -> UserRead` | admin | [AdminUsersPage](../Recon/src/portal/pages/admin/AdminUsersPage.tsx) | Used |
| `GET` | `/api/v1/users/` | `list[UserRead]` | admin | [AdminUsersPage](../Recon/src/portal/pages/admin/AdminUsersPage.tsx) | Used |
| `GET` | `/api/v1/users/{user_id}` | `UserRead` | admin | [AdminUsersPage](../Recon/src/portal/pages/admin/AdminUsersPage.tsx) | Used |
| `PATCH` | `/api/v1/users/{user_id}` | `UserUpdate -> UserRead` | admin | [AdminUsersPage](../Recon/src/portal/pages/admin/AdminUsersPage.tsx) | Used |
| `DELETE` | `/api/v1/users/{user_id}` | none | admin | [AdminUsersPage](../Recon/src/portal/pages/admin/AdminUsersPage.tsx) | Used |

## Participants

| Method | Endpoint | Schemas | Auth | Frontend consumer | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/participants/me` | `ParticipantCreate -> ParticipantRead` | authenticated | [ProfileSetupPage](../Recon/src/portal/pages/ProfileSetupPage.tsx) | Used |
| `GET` | `/api/v1/participants/me` | `ParticipantRead` | authenticated | [authStore](../Recon/src/portal/stores/authStore.ts), [SettingsPage](../Recon/src/portal/pages/SettingsPage.tsx) | Used |
| `PATCH` | `/api/v1/participants/me` | `ParticipantUpdate -> ParticipantRead` | authenticated | [SettingsPage](../Recon/src/portal/pages/SettingsPage.tsx) | Used |
| `PATCH` | `/api/v1/participants/me/talent-visibility` | `ParticipantTalentVisibilityUpdate -> ParticipantRead` | authenticated | [SettingsPage](../Recon/src/portal/pages/SettingsPage.tsx) | Used |
| `GET` | `/api/v1/participants/me/dashboard` | `ParticipantDashboardRead` | authenticated | [authStore](../Recon/src/portal/stores/authStore.ts) | Used |
| `GET` | `/api/v1/me/dashboard` | `ParticipantDashboardRead` | authenticated | backend alias only; frontend standardizes on `/participants/me/dashboard` | Intentional alias |
| `GET` | `/api/v1/participants/{participant_id}` | `ParticipantRead` | authenticated | [AdminParticipantsPage](../Recon/src/portal/pages/admin/AdminParticipantsPage.tsx) | Used |
| `GET` | `/api/v1/participants/` | `list[ParticipantRead]` | admin | [AdminParticipantsPage](../Recon/src/portal/pages/admin/AdminParticipantsPage.tsx), [AdminTeamsPage](../Recon/src/portal/pages/admin/AdminTeamsPage.tsx) | Used |
| `POST` | `/api/v1/participants/{participant_id}/checkin` | `ParticipantCheckInRead` | admin | [AdminParticipantsPage](../Recon/src/portal/pages/admin/AdminParticipantsPage.tsx) | Used |

## Zones + Passes

| Method | Endpoint | Schemas | Auth | Frontend consumer | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/zones` | `list[ZoneCatalogItemRead]` | authenticated | [ZonesPage](../Recon/src/portal/pages/ZonesPage.tsx), [ZoneDetailPage](../Recon/src/portal/pages/ZoneDetailPage.tsx), [DashboardPage](../Recon/src/portal/pages/DashboardPage.tsx) | Used |
| `GET` | `/api/v1/zones/{zone_id}` | `ZoneRead` | authenticated | [ZoneDetailPage](../Recon/src/portal/pages/ZoneDetailPage.tsx) | Used |
| `POST` | `/api/v1/zones/{zone_id}/register` | `ZoneRegistrationRead` | authenticated | legacy registration contract kept server-side; frontend now uses signed QR registration | Intentional legacy |
| `POST` | `/api/v1/events/{event_id}/registrations` | `EventRegistrationCreate -> EventRegistrationQrRead` | authenticated | [zoneStore](../Recon/src/portal/stores/zoneStore.ts) | Used |
| `GET` | `/api/v1/registrations/{registration_id}/qr` | `EventRegistrationQrRead` | authenticated | [zoneStore](../Recon/src/portal/stores/zoneStore.ts) on-demand refresh | New UI |
| `POST` | `/api/v1/admin/scans/check-in` | `AdminScanCheckInCreate -> AdminScanCheckInRead` | admin | [AdminApiCoveragePage](../Recon/src/portal/pages/admin/AdminApiCoveragePage.tsx) | New UI |
| `DELETE` | `/api/v1/zones/{zone_id}/register` | `ZoneRegistrationRead` | authenticated | [zoneStore](../Recon/src/portal/stores/zoneStore.ts) | Used |
| `GET` | `/api/v1/me/registrations` | `MyRegistrationsRead` | authenticated | [zoneStore](../Recon/src/portal/stores/zoneStore.ts) | Used |
| `GET` | `/api/v1/me/passes` | `MyPassesRead` | authenticated | [zoneStore](../Recon/src/portal/stores/zoneStore.ts) | Used |

## Announcements + Realtime

| Method | Endpoint | Schemas | Auth | Frontend consumer | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/announcements/` | `list[AnnouncementRead]` | authenticated | [announcementStore](../Recon/src/portal/stores/announcementStore.ts), [AnnouncementsPage](../Recon/src/portal/pages/AnnouncementsPage.tsx) | Used |
| `GET` | `/api/v1/announcements/{announcement_id}` | `AnnouncementRead` | authenticated | admin tooling not currently needing single-record drilldown | Intentional |
| `POST` | `/api/v1/announcements/` | `AnnouncementCreate -> AnnouncementRead` | admin | [AdminApiCoveragePage](../Recon/src/portal/pages/admin/AdminApiCoveragePage.tsx) | Used |
| `PATCH` | `/api/v1/announcements/{announcement_id}` | `AnnouncementUpdate -> AnnouncementRead` | admin | [AdminApiCoveragePage](../Recon/src/portal/pages/admin/AdminApiCoveragePage.tsx) | Used |
| `DELETE` | `/api/v1/announcements/{announcement_id}` | none | admin | [AdminApiCoveragePage](../Recon/src/portal/pages/admin/AdminApiCoveragePage.tsx) | Used |
| `WS` | `/api/v1/realtime/announcements/ws` | realtime announcement events | authenticated | [PortalLayout](../Recon/src/portal/components/PortalLayout.tsx), [announcementStore](../Recon/src/portal/stores/announcementStore.ts) | New UI |

## Incidents

| Method | Endpoint | Schemas | Auth | Frontend consumer | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/incidents/` | `IncidentCreate -> IncidentRead` | authenticated | [AdminIncidentsPage](../Recon/src/portal/pages/admin/AdminIncidentsPage.tsx) | Used |
| `GET` | `/api/v1/incidents/` | `list[IncidentRead]` | admin | [AdminIncidentsPage](../Recon/src/portal/pages/admin/AdminIncidentsPage.tsx) | Used |
| `GET` | `/api/v1/incidents/{incident_id}` | `IncidentRead` | admin | [AdminIncidentsPage](../Recon/src/portal/pages/admin/AdminIncidentsPage.tsx) | Used |
| `PATCH` | `/api/v1/incidents/{incident_id}` | `IncidentUpdate -> IncidentRead` | admin | [AdminIncidentsPage](../Recon/src/portal/pages/admin/AdminIncidentsPage.tsx) | Used |

## Schedule + Speakers

| Method | Endpoint | Schemas | Auth | Frontend consumer | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/schedule` | `list[SessionRead]` | authenticated | [Schedule](../Recon/src/components/Schedule.tsx), [AdminSchedulePage](../Recon/src/portal/pages/admin/AdminSchedulePage.tsx) | Used |
| `GET` | `/api/v1/schedule/{session_id}` | `SessionDetailRead` | admin | list payload is sufficient for current editor flow | Intentional |
| `POST` | `/api/v1/schedule` | `SessionCreate -> SessionRead` | admin | [AdminSchedulePage](../Recon/src/portal/pages/admin/AdminSchedulePage.tsx) | Used |
| `PATCH` | `/api/v1/schedule/{session_id}` | `SessionUpdate -> SessionRead` | admin | [AdminSchedulePage](../Recon/src/portal/pages/admin/AdminSchedulePage.tsx) | Used |
| `DELETE` | `/api/v1/schedule/{session_id}` | none | admin | [AdminSchedulePage](../Recon/src/portal/pages/admin/AdminSchedulePage.tsx) | Used |
| `POST` | `/api/v1/schedule/{session_id}/speakers` | query params -> none | admin | [AdminSchedulePage](../Recon/src/portal/pages/admin/AdminSchedulePage.tsx) | Used |
| `DELETE` | `/api/v1/schedule/{session_id}/speakers/{speaker_id}` | none | admin | [AdminSchedulePage](../Recon/src/portal/pages/admin/AdminSchedulePage.tsx) | Used |
| `GET` | `/api/v1/schedule/speakers/all` | `list[SpeakerRead]` | authenticated | [Team](../Recon/src/components/Team.tsx), [AdminSchedulePage](../Recon/src/portal/pages/admin/AdminSchedulePage.tsx) | Used |
| `POST` | `/api/v1/schedule/speakers` | `SpeakerCreate -> SpeakerRead` | admin | [AdminSchedulePage](../Recon/src/portal/pages/admin/AdminSchedulePage.tsx) | Used |
| `PATCH` | `/api/v1/schedule/speakers/{speaker_id}` | `SpeakerUpdate -> SpeakerRead` | admin | speaker edit is not currently needed for content ops | Intentional |
| `DELETE` | `/api/v1/schedule/speakers/{speaker_id}` | none | admin | [AdminSchedulePage](../Recon/src/portal/pages/admin/AdminSchedulePage.tsx) | Used |

## Shop

| Method | Endpoint | Schemas | Auth | Frontend consumer | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/shop/` | `list[ShopItemRead]` | authenticated | [MerchPage](../Recon/src/portal/pages/MerchPage.tsx), [AdminApiCoveragePage](../Recon/src/portal/pages/admin/AdminApiCoveragePage.tsx) | Used |
| `GET` | `/api/v1/shop/me/redemptions` | `list[RedemptionRead]` | authenticated | admin tooling only; participant redemption history screen not in current product nav | Intentional |
| `GET` | `/api/v1/shop/redemptions` | `list[RedemptionRead]` | admin | [AdminApiCoveragePage](../Recon/src/portal/pages/admin/AdminApiCoveragePage.tsx) | Used |
| `PATCH` | `/api/v1/shop/redemptions/{redemption_id}/fulfill` | `RedemptionFulfill -> RedemptionRead` | admin | [AdminApiCoveragePage](../Recon/src/portal/pages/admin/AdminApiCoveragePage.tsx) | Used |
| `PATCH` | `/api/v1/shop/redemptions/{redemption_id}/return` | `RedemptionReturn -> RedemptionRead` | admin | [AdminApiCoveragePage](../Recon/src/portal/pages/admin/AdminApiCoveragePage.tsx) | New UI |
| `GET` | `/api/v1/shop/{item_id}` | `ShopItemRead` | authenticated | [AdminApiCoveragePage](../Recon/src/portal/pages/admin/AdminApiCoveragePage.tsx) | Used |
| `POST` | `/api/v1/shop/{item_id}/redeem` | `RedemptionRedeem -> RedemptionRead` | authenticated | [MerchPage](../Recon/src/portal/pages/MerchPage.tsx) | Used |
| `POST` | `/api/v1/shop/` | `ShopItemCreate -> ShopItemRead` | admin | [AdminApiCoveragePage](../Recon/src/portal/pages/admin/AdminApiCoveragePage.tsx) | Used |
| `PATCH` | `/api/v1/shop/{item_id}` | `ShopItemUpdate -> ShopItemRead` | admin | [AdminApiCoveragePage](../Recon/src/portal/pages/admin/AdminApiCoveragePage.tsx) | Used |

## Teams

| Method | Endpoint | Schemas | Auth | Frontend consumer | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/teams/` | `TeamCreate -> TeamRead` | participant | [HuntTeamPage](../Recon/src/portal/pages/hunt/HuntTeamPage.tsx) | Used |
| `POST` | `/api/v1/teams/join` | `TeamJoin -> TeamRead` | participant | [HuntTeamPage](../Recon/src/portal/pages/hunt/HuntTeamPage.tsx) | Used |
| `GET` | `/api/v1/teams/me` | `TeamRead` | participant | [teamStore](../Recon/src/portal/stores/teamStore.ts), [HuntTeamPage](../Recon/src/portal/pages/hunt/HuntTeamPage.tsx) | Used |
| `GET` | `/api/v1/teams/admin` | `TeamListRead` | admin | [AdminTeamsPage](../Recon/src/portal/pages/admin/AdminTeamsPage.tsx) | New UI |
| `POST` | `/api/v1/teams/admin` | `TeamAdminCreate -> TeamRead` | admin | [AdminTeamsPage](../Recon/src/portal/pages/admin/AdminTeamsPage.tsx) | New UI |
| `GET` | `/api/v1/teams/admin/{team_id}` | `TeamRead` | admin | current admin page loads from list payload | Intentional |
| `PATCH` | `/api/v1/teams/admin/{team_id}` | `TeamAdminUpdate -> TeamRead` | admin | [AdminTeamsPage](../Recon/src/portal/pages/admin/AdminTeamsPage.tsx) | New UI |
| `DELETE` | `/api/v1/teams/admin/{team_id}` | none | admin | [AdminTeamsPage](../Recon/src/portal/pages/admin/AdminTeamsPage.tsx) | New UI |
| `PUT` | `/api/v1/teams/admin/participants/{participant_id}/team` | `TeamMembershipAdminUpdate -> TeamAssignmentRead` | admin | [AdminTeamsPage](../Recon/src/portal/pages/admin/AdminTeamsPage.tsx) | New UI |

## Treasure Hunt

| Method | Endpoint | Schemas | Auth | Frontend consumer | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/treasure-hunt/scan/{qr_token}` | `TreasureHuntProblemRead` | participant | [HuntScanPage](../Recon/src/portal/pages/hunt/HuntScanPage.tsx) | Used |
| `POST` | `/api/v1/treasure-hunt/problems/{problem_id}/submit` | `TreasureHuntFlagSubmitPayload -> TreasureHuntFlagSubmitRead` | participant | [HuntProblemPage](../Recon/src/portal/pages/hunt/HuntProblemPage.tsx) | Used |
| `GET` | `/api/v1/treasure-hunt/me/progress` | `TreasureHuntTeamProgressRead` | participant | [HuntProgressPage](../Recon/src/portal/pages/hunt/HuntProgressPage.tsx) | Used |
| `GET` | `/api/v1/treasure-hunt/leaderboard` | `TreasureHuntLeaderboardRead` | participant | [HuntLeaderboardPage](../Recon/src/portal/pages/hunt/HuntLeaderboardPage.tsx), [HuntDisplayPage](../Recon/src/portal/pages/hunt/HuntDisplayPage.tsx) | Used |
| `GET` | `/api/v1/treasure-hunt/finishers` | `TreasureHuntLeaderboardRead` | participant | [HuntHomePage](../Recon/src/portal/pages/hunt/HuntHomePage.tsx) | Used |

## Partners

| Method | Endpoint | Schemas | Auth | Frontend consumer | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/partners/apply` | `PartnerCreate -> PartnerRead` | authenticated | [AdminPartnersPage](../Recon/src/portal/pages/admin/AdminPartnersPage.tsx) | Used |
| `GET` | `/api/v1/partners/me` | `PartnerRead` | partner | current frontend has no dedicated partner dashboard route | Intentional |
| `POST` | `/api/v1/partners/me/incentives` | `PartnerIncentiveCreate -> PartnerIncentiveRead` | partner | [AdminPartnersPage](../Recon/src/portal/pages/admin/AdminPartnersPage.tsx) | Used |
| `PATCH` | `/api/v1/partners/me/incentives/{incentive_id}` | `PartnerIncentiveUpdate -> PartnerIncentiveRead` | partner | incentive edit is not yet part of current partner flow | Intentional |
| `DELETE` | `/api/v1/partners/me/incentives/{incentive_id}` | none | partner | [AdminPartnersPage](../Recon/src/portal/pages/admin/AdminPartnersPage.tsx) | Used |
| `POST` | `/api/v1/partners/me/assets` | `PartnerAssetCreate -> PartnerAssetRead` | partner | [AdminPartnersPage](../Recon/src/portal/pages/admin/AdminPartnersPage.tsx) | Used |
| `DELETE` | `/api/v1/partners/me/assets/{asset_id}` | none | partner | asset delete is not in current partner flow | Intentional |
| `GET` | `/api/v1/partners/` | `list[PartnerRead]` | admin | [AdminPartnersPage](../Recon/src/portal/pages/admin/AdminPartnersPage.tsx), [Home](../Recon/src/components/Home.tsx), [Sponsors](../Recon/src/components/Sponsors.tsx) fallback-enabled | Used |
| `GET` | `/api/v1/partners/{partner_id}` | `PartnerRead` | admin | current admin list provides enough detail for review flow | Intentional |
| `POST` | `/api/v1/partners/{partner_id}/review` | `PartnerReviewCreate -> PartnerRead` | admin | [AdminPartnersPage](../Recon/src/portal/pages/admin/AdminPartnersPage.tsx) | Used |

## Storage

| Method | Endpoint | Schemas | Auth | Frontend consumer | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/r2/upload-url` | `PresignedUploadResponse` | authenticated | [AdminStoragePage](../Recon/src/portal/pages/admin/AdminStoragePage.tsx) | Used |
| `GET` | `/api/v1/r2/read-url` | `PresignedReadResponse` | authenticated | [AdminStoragePage](../Recon/src/portal/pages/admin/AdminStoragePage.tsx), [shop API enrichment](../Recon/src/portal/api/shop.ts) | Used |

## Points

| Method | Endpoint | Schemas | Auth | Frontend consumer | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/points/award` | `PointAwardCreate -> PointAwardRead` | admin | [AdminApiCoveragePage](../Recon/src/portal/pages/admin/AdminApiCoveragePage.tsx) | Used |
| `GET` | `/api/v1/points/me` | `PointMeRead` | authenticated | [AdminApiCoveragePage](../Recon/src/portal/pages/admin/AdminApiCoveragePage.tsx) | Used (admin tooling) |
| `GET` | `/api/v1/points/leaderboard` | `PointLeaderboardPageRead` | authenticated | [AdminApiCoveragePage](../Recon/src/portal/pages/admin/AdminApiCoveragePage.tsx) | Used (admin tooling) |
| `GET` | `/api/v1/points/leaderboard/me` | `PointLeaderboardMeRead` | authenticated | [AdminApiCoveragePage](../Recon/src/portal/pages/admin/AdminApiCoveragePage.tsx) | Used (admin tooling) |
| `GET` | `/api/v1/points/transactions` | `PointTransactionsPageRead` | admin | [AdminApiCoveragePage](../Recon/src/portal/pages/admin/AdminApiCoveragePage.tsx) | Used |
| `POST` | `/api/v1/points/team-events/award-delta` | `TeamCompetitionAwardDeltaCreate -> TeamCompetitionAwardRead` | admin | normalized scoring is internal ops data, not a current portal task | Intentional |
| `POST` | `/api/v1/points/team-events/ingest-snapshot` | `TeamCompetitionSnapshotIngestCreate -> TeamCompetitionAwardRead` | admin | normalized scoring is internal ops data, not a current portal task | Intentional |
| `GET` | `/api/v1/points/team-events/leaderboard` | `TeamCompetitionLeaderboardPageRead` | authenticated | participant-facing experience uses treasure-hunt-specific leaderboard today | Intentional |
| `GET` | `/api/v1/points/team-events/me` | `TeamCompetitionMeRead` | participant/admin | shared normalized team scoring is not yet a standalone portal surface | Intentional |
| `GET` | `/api/v1/points/team-events/rules` | `TeamCompetitionRulesRead` | authenticated | internal rules metadata backing admin competition ops | Intentional |
| `POST` | `/api/v1/points/team-events/settlements/preview` | `TeamCompetitionSettlementPreviewCreate -> TeamCompetitionSettlementPreviewRead` | admin | finance/settlement operation remains off-portal | Intentional |
| `POST` | `/api/v1/points/team-events/settlements` | `TeamCompetitionSettlementFinalizeCreate -> TeamCompetitionSettlementRead` | admin | finance/settlement operation remains off-portal | Intentional |
| `GET` | `/api/v1/points/team-events/settlements` | `TeamCompetitionSettlementListRead` | admin | finance/settlement operation remains off-portal | Intentional |
| `GET` | `/api/v1/points/team-events/settlements/{settlement_id}` | `TeamCompetitionSettlementRead` | admin | finance/settlement operation remains off-portal | Intentional |
