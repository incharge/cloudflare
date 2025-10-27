// Convert text to HTML
// Escapes HTML entities to prevent XSS
// Converts newlines to <br>
export function textToHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    "\n": '<br>\n',
    "\r": '',
  };
  return text.replace(/[&<>"'\n\r]/g, (m) => map[m]);
}