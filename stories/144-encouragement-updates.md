# Story 144: As a workout buddy, I want new encouragement to show up while my Dashboard or Buddies page is open, which is confirmed by seeing a message a buddy just sent appear without refreshing the page.

- **Tasks:** #148 (the encouragement poller)
- **Automated in:** not automated yet (the story has no Playwright task card)

## Acceptance Test 1: A new message appears on an open Dashboard

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. Window A (normal): open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and log in as buddy-olivia@example.com. The Dashboard opens. Scroll to "From your buddies".
3. Window B (Incognito): open the same link and log in as buddy-ben@example.com.

**Steps:**
1. In window B, choose "Buddies" in the menu, click "Encourage" on Olivia G.'s card, type "Dashboard check: great squats!" and click "Send". "Encouragement sent to Olivia G." should show.
2. In window A, don't click or refresh anything. Within about 10 seconds, "From your buddies" should change to Ben C., the time, and "Dashboard check: great squats!" with a green "New" mark.
3. Wait another 20 seconds without touching window A. The message should still be shown once, and the page should not have reloaded (the scroll position is where you left it).

## Acceptance Test 2: A new message appears on an open Buddies page while you type

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. Window A (normal): log in as buddy-olivia@example.com at https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and choose "Buddies" in the menu.
3. Window B (Incognito): log in as buddy-ben@example.com at the same link and choose "Buddies" in the menu.

**Steps:**
1. In window A, click "Encourage" on Ben C.'s card. A message window opens over the page. Type "Thanks Ben, see you at" in its box. Don't send it.
2. In window B, click "Encourage" on Olivia G.'s card, type "Buddies check: keep it up!" and click "Send".
3. In window A, don't click anything. Within about 10 seconds, "Buddies check: keep it up!" from Ben C. should appear at the top of "Encouragements for you", behind the dimmed message window, with a green "New" mark, once. (On a narrow window, close the message window with Cancel afterwards to look; on a computer it shows beside it.)
4. In window A, look at the message window. It should still be open, and its box should still say "Thanks Ben, see you at", with the counter at "22/140". Click at the end of the text and type " 6!". The box should say "Thanks Ben, see you at 6!".
5. Click "Send". The window should close and "Encouragement sent to Ben C." should show.

## Acceptance Test 3: After the connection comes back, the missed message arrives

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. On a laptop: window A (normal) logged in as buddy-olivia@example.com on "Buddies"; on a phone (or a second computer): logged in as buddy-ben@example.com on "Buddies".

**Steps:**
1. On the laptop, turn Wi-Fi off (click the Wi-Fi icon in the menu bar and switch it off). Leave window A open.
2. On the phone, send Olivia G. the encouragement "Offline check: you got this".
3. On the laptop, wait 15 seconds. Window A should still show its group and messages, with no error box and no blank page.
4. Turn the laptop's Wi-Fi back on and reconnect to the VPN if you use it. Within about a minute (usually a few seconds), "Offline check: you got this" should appear in window A once, with a green "New" mark, without refreshing.

## Acceptance Test 4: The next account never sees the previous account's messages

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and log in as buddy-olivia@example.com. Check that "From your buddies" on the Dashboard shows a message from Ben C. (send one from buddy-ben@example.com first if it says "No encouragement yet").

**Steps:**
1. Click "Log out" at the bottom of the menu. "You are logged out." should show.
2. In the same window, log in as buddy-pete@example.com. On the Dashboard, "From your buddies" should say "No encouragement yet. Send one to someone in Late Starters from the Buddies page.", with nothing from Ben C. or Olivia G.
3. Wait 20 seconds. Nothing from Morning Lifters should appear.
4. Choose "Buddies" in the menu. The page should show "Late Starters" and "No encouragements yet. When someone in your group encourages you, it appears here."

## Notes

Copied from card #144 on 2026-11-19, word for word (the card has no introduction or test-account paragraph; the accounts are the ones in database/seeds/workout_buddies.sql, password Buddy-Test-78!). Only the headings are `##` so the Playwright runner can find them; the story has no spec yet, so nothing runs it.
