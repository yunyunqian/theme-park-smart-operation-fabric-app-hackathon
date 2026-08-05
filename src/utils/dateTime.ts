export const formatTime = (value: string | Date) => new Intl.DateTimeFormat('en-US', {
  hour: 'numeric', minute: '2-digit', second: '2-digit',
}).format(new Date(value))

export const formatDate = (value: string | Date) => new Intl.DateTimeFormat('en-US', {
  weekday: 'short', month: 'short', day: 'numeric',
}).format(new Date(value))

export const minutesAgo = (value: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  return minutes < 1 ? 'just now' : `${minutes} min ago`
}
