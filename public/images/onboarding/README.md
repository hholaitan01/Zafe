# Onboarding mosaic images

The onboarding screen (`app/onboarding/page.tsx`) is a swipeable 3-slide
carousel. Each slide builds a tilted collage from **14 files** `01.jpg` …
`14.jpg` inside its folder:

- `slide1/` — "Buy from anyone" (products people trade: phones, sneakers, laptops, watches, bags, gadgets)
- `slide2/` — "Your money stays safe" (payment / trust: mobile payment, banking apps, cash, card taps)
- `slide3/` — "Reliable every step" (delivery: parcels, couriers, unboxing, shipping boxes)

Replace any file at the **same path and name** and the mosaic updates with no
code change.

The current set was sourced from **Unsplash and Pexels** (free license,
commercial use, no attribution required). Swap in brand-generated photos any
time; the prompts below produce a cohesive set.

**Specs for every image**
- Square-ish, at least **900×900px**, JPG, optimised (aim < 200 KB each).
- One clear subject that survives a square crop and a slight tilt.
- Consistent look within a slide (shared lighting/tone) so each mosaic reads as
  one set, not clip art.
- No on-image text, watermarks, or brand logos.

**Shared style line** (append to every prompt):
> natural soft daylight, shallow depth of field, warm neutral tones, authentic
> candid moment, clean uncluttered background, high-resolution editorial
> e-commerce photography, Nigerian / West-African context, no text, no logos,
> 1:1 square composition

## Prompt themes

**slide1 — Buy from anyone** (14 images): a new smartphone; a pair of clean
sneakers; a laptop on a desk; a wristwatch close-up; wireless earbuds; a
handbag; a camera; folded clothing; a games console; a fragrance bottle; a
tablet; sunglasses; a shopping bag; a hand holding a phone mid-purchase.

**slide2 — Your money stays safe** (14 images): a contactless phone payment; a
mobile-banking app screen in hand; a card tap on a terminal; counting cash
notes; a digital-wallet screen; a person paying on their phone at a table; a
secure-lock icon on a phone; two people shaking hands over a deal; a phone
showing a payment confirmation; an online-checkout screen; a POS terminal; a
person smiling while paying by phone; a hand and a bank card; a phone on a
receipt.

**slide3 — Reliable every step** (14 images): a parcel on a doorstep; a courier
handing a box to a customer; someone unboxing a parcel; a delivery rider on a
motorbike; stacked shipping boxes; a happy customer holding a package; a
delivery van; hands opening a cardboard box; a fragile-taped parcel; a courier
walking with a bag; a warehouse of parcels; a package left at a door.

Generate at the highest quality your image model offers, then downscale to the
spec above. Keep lighting and tone consistent within each slide.
