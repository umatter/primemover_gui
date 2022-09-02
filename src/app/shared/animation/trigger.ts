import { style, animate, trigger, transition } from '@angular/animations';

export const fadeSlideInOut = trigger('fadeSlideInOut', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate('200ms', style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [animate('150ms', style({ opacity: 0, transform: 'translateY(10px)' }))])
]);

export const fadeIn = trigger('fadeIn', [
  transition(':enter', [style({ opacity: 0 }), animate('200ms', style({ opacity: 1 }))]),
  transition(':leave', [
    style({ opacity: 1, transform: 'translate(0, 0)' }),
    animate('200ms', style({ opacity: 0, transform: 'translate(0, 0)' }))
  ])
]);

export const backdropAnimated = trigger('backdropAnimated', [
  transition(':enter', [style({ opacity: 0 }), animate('300ms', style({ opacity: 1 }))]),
  transition(':leave', [
    style({ opacity: 1, transform: 'translate(0, 0)' }),
    animate('300ms', style({ opacity: 0, transform: 'translate(-250px, 0)' }))
  ])
]);

export const modalAnimated = trigger('modalAnimated', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(0)' }),
    animate('300ms ease-out', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    style({ opacity: 1, transform: 'translateY(1rem)' }),
    animate('200ms ease-in', style({ opacity: 0, transform: 'translate(-250px, 0)' }))
  ])
]);

/**
  Entering: "ease-out duration-300"
    From: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
    To: "opacity-100 translate-y-0 sm:scale-100"
  Leaving: "ease-in duration-200"
    From: "opacity-100 translate-y-0 sm:scale-100"
    To: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
*/
