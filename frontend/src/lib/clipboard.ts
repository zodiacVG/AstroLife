export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {}

  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', 'true')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return true
  } catch {}
  return false
}

export async function copyHtmlFromElement(el: HTMLElement, name?: string, question?: string): Promise<boolean> {
  try {
    // Prefer rich clipboard with HTML + plain text
    const html = el.innerHTML
    const text = el.innerText
    const experienceUrl = '\n\n体验网址：https://astroracle2.zeabur.app/'
    
    // 在文本开头添加名字和问题信息
    const headerText = name && question ? `${name} - ${question}\n\n` : ''
    
    if (navigator.clipboard && 'write' in navigator.clipboard && (window as any).ClipboardItem) {
      const item = new (window as any).ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([headerText + text + experienceUrl], { type: 'text/plain' })
      })
      // @ts-ignore
      await navigator.clipboard.write([item])
      return true
    }
  } catch {}

  // Fallback: copy plain text
  try {
    const experienceUrl = '\n\n体验网址：https://astroracle2.zeabur.app/'
    const headerText = name && question ? `${name} - ${question}\n\n` : ''
    const text = el.innerText
    return await copyText(headerText + text + experienceUrl)
  } catch {}
  return false
}

