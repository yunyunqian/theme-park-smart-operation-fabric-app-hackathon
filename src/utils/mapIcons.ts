import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { divIcon } from 'leaflet'
import type { LucideIcon } from 'lucide-react'

export const createMapIcon = (Icon: LucideIcon, color: string, label: string) => divIcon({
  className: 'operational-map-icon-wrap',
  html: renderToStaticMarkup(createElement('span', {
    className: 'operational-map-icon',
    style: { '--marker-color': color },
    title: label,
  }, createElement(Icon, { size: 16, strokeWidth: 2.4 }))),
  iconSize: [32, 38],
  iconAnchor: [16, 36],
  tooltipAnchor: [0, -34],
})
