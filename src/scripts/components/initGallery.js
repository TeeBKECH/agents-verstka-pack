// Просмотр фото на весь экран (Fancybox): a(href="большое.jpg" data-fancybox="gallery-name")
// Окно Fancybox создаётся в <body> — вне масштаба .page-scale, поэтому размеры не сбиваются.
import { Fancybox } from '@fancyapps/ui/dist/fancybox/'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

export function init() {
  Fancybox.bind('[data-fancybox]')
}
