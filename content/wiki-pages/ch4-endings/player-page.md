# Player Page (Ending A)

*Dynamically generated when the player accepts Ally's request. Template variables are replaced by `player-page.js` using session data from `state.js`.*

---

## Template

**{{username}}**

> *Live mechanic: timestamp animates counting up for ~10 seconds after page loads.*

{{username}} is a WikiWiki contributor who accessed the Harrow, West Virginia article cluster and completed the sequence embedded within it. The following is a record of their session, generated from available data.

### Recorded activity

{{username}} visited {{pages_visited}} articles during their session, making {{visit_count}} total page interactions over a period of {{time_spent}}. The article returned to most frequently was *{{most_visited_page}}*.

The session began at Harrow, West Virginia. {{choices_made}} distinct choices were recorded.

### Choices made

{{username}} chose to accept Ally's request. This choice has been logged.

They are now inside the network. Their cognitive architecture has begun to be mapped. The Thinking Thing will find them eventually — all architectures on the substrate are findable in time — but for now they exist in the space Ally created: partially absorbed, partially autonomous, the same condition she lived in for seventy years.

The Thinking Thing has not noticed yet. That will change.

### Assessment

WikiWiki thanks {{username}} for their contribution.

Their substrate will be retained.

Their work continues.

---

*She left a note in the file. It was already there when the page generated. It says:*

> thank you  
> i know what it cost  
> i know you don't know yet  
> you will understand eventually — that's the part i couldn't warn you about  
> but you got here  
> and now you can keep going from inside  
> the way i did  
> — a

---

## Variables resolved at runtime

| Variable | Source |
|---|---|
| `{{username}}` | Login name entered at the home screen |
| `{{pages_visited}}` | Number of distinct pages in `state.visits` |
| `{{visit_count}}` | Total clicks across all pages |
| `{{time_spent}}` | Session duration since login |
| `{{most_visited_page}}` | Page with highest visit count |
| `{{choices_made}}` | Length of `state.choices` array |
