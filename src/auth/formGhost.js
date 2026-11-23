// A look-alike of a form for the moment it slides away (EntryScreen.jsx): the same boxes and words with every style
// written inline, but no ids, labels, names, classes or ARIA. Nothing can find, focus or fill it, so during the slide
// the page holds only one real form (one "Email" box, one "Log in" link) for people, screen readers and tests.
const SKIP = /^(animation|transition|will-change|cursor|pointer-events|user-select|-webkit-user-select)/
const KEEP = { input: ['type', 'placeholder'], svg: ['viewBox', 'xmlns', 'fill', 'stroke'], path: ['d'] }
const RENAME = { label: 'span', a: 'span', button: 'span', form: 'div', section: 'div', h1: 'div', h2: 'div', p: 'div', meter: 'div' }

function copy(source) {
  if (source.nodeType === Node.TEXT_NODE) return document.createTextNode(source.textContent)
  if (source.nodeType !== Node.ELEMENT_NODE) return null
  const tag = source.localName
  const svg = source instanceof SVGElement
  const element = svg ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(RENAME[tag] ?? tag)
  for (const name of KEEP[tag] ?? []) if (source.hasAttribute(name)) element.setAttribute(name, source.getAttribute(name))
  if (tag === 'input' && source.value) element.setAttribute('value', source.value)
  const computed = getComputedStyle(source)
  for (let index = 0; index < computed.length; index += 1) {
    const property = computed[index]
    if (!SKIP.test(property)) element.style.setProperty(property, computed.getPropertyValue(property))
  }
  for (const child of source.childNodes) {
    const childCopy = copy(child)
    if (childCopy) element.appendChild(childCopy)
  }
  return element
}

export function ghostOf(node) {
  if (!node) return ''
  const wrapper = document.createElement('div')
  for (const child of node.childNodes) {
    const childCopy = copy(child)
    if (childCopy) wrapper.appendChild(childCopy)
  }
  return wrapper.innerHTML
}
