// Requests for the Workout buddies page (story #78, card #79), against Mansur's backend (card #71):
//   GET  api/buddy_group.php                                  -> the group view
//   POST api/buddy_group.php {"create": true, "name": "..."}  -> 201 the group view, caller is the owner
//   POST api/buddy_join.php {"code": "7KQ2MXP9"}              -> 200 the group view after joining
//   POST api/buddy_encourage.php {"member_id": 12, "message": "..."} -> 201 {encouragement: {id, to, message, sent_at}}
// The group view: {group: {name, member_count, invite_code, invite_expires_at, members: [{member_id, name ("Ben C."),
// is_me, is_owner}]}, me: {member_id, is_owner}, encouragements: [{id, from, message, sent_at}]}. invite_code and
// invite_expires_at are null unless the caller owns the group. Someone in no group gets
// {group: null, me: null, encouragements: []} with status 200. Errors: 400 {errors: {code|name|member_id|message}},
// 401, 404 {error}, 409 {error}. Every function resolves to apiRequest's {ok, status, data}; it never throws.
import { apiRequest } from '../onboarding/api.js'

function post(path, body) {
  return apiRequest(path, { method: 'POST', body: JSON.stringify(body) })
}

export function getBuddyGroup() {
  return apiRequest('buddy_group.php')
}

export function createBuddyGroup(name) {
  return post('buddy_group.php', { create: true, name })
}

export function joinBuddyGroup(code) {
  return post('buddy_join.php', { code })
}

export function sendEncouragement(memberId, message) {
  return post('buddy_encourage.php', { member_id: memberId, message })
}
