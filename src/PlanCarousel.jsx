import { useRef, useState } from 'react'

// A list of plan cards. On phones (index.css) it is a swipeable row that snaps card by card, with the
// next card peeking in and a dot under it for each card; on larger screens it is the plan grid and the
// dots are hidden. renderPlan(plan) returns the <li> for one plan; label names the dots' group.
function PlanCarousel({ plans, label, renderPlan }) {
  const [active, setActive] = useState(0)
  const listRef = useRef(null)

  // The dot of the card nearest the left edge is the current one.
  function onScroll() {
    const list = listRef.current
    const first = list?.children[0]
    if (!first) return
    const step = list.children[1] ? list.children[1].offsetLeft - first.offsetLeft : first.offsetWidth
    setActive(Math.min(list.children.length - 1, Math.max(0, Math.round(list.scrollLeft / step))))
  }

  function showCard(index) {
    const list = listRef.current
    const card = list?.children[index]
    if (!card) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollTo({ left: card.offsetLeft - list.children[0].offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <>
      <ul className="plan-list plan-list--carousel" ref={listRef} onScroll={onScroll}>
        {plans.map(renderPlan)}
      </ul>
      {plans.length > 1 && (
        <div className="plan-dots" role="group" aria-label={`${label} pages`}>
          {plans.map((plan, index) => (
            <button
              key={plan.id}
              type="button"
              className="plan-dots__dot"
              aria-label={`Show plan ${index + 1} of ${plans.length}: ${plan.name}`}
              aria-current={index === active ? 'true' : undefined}
              onClick={() => showCard(index)}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default PlanCarousel
