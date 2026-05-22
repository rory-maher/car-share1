# Car Share App — Architecture & Technical Overview

## Language

Everything is written in **JavaScript** — one language for the whole app.

- `.js` files — plain JavaScript (server)
- `.jsx` files — JavaScript with HTML mixed in (React's syntax, frontend only)
- `.css` — styling
- `.json` — config files and the database

---

## Project Structure

```
car-share/
│
├── server/               ← backend (runs on Railway cloud server)
│   ├── index.js          ← starts the Express server
│   ├── db.js             ← reads/writes the database file
│   ├── db.json           ← the actual database (plain text file)
│   └── routes/
│       ├── cars.js       ← handles car add/remove/list requests
│       └── bookings.js   ← handles booking create/cancel requests
│
└── client/               ← frontend (runs in the browser)
    └── src/
        ├── App.jsx        ← main page layout
        ├── App.css        ← all styling
        ├── api.js         ← all calls to the server
        └── components/
            ├── Calendar.jsx      ← month calendar grid
            ├── CarItem.jsx       ← one car card + bookings list
            ├── BookingModal.jsx  ← booking form popup
            ├── AddCarModal.jsx   ← add car form popup
            └── InstallButton.jsx ← "Install App" button (PWA)
```

---

## System Architecture

```
┌─────────────────────────────────────────┐
│              User's Device              │
│                                         │
│  Browser / PWA                          │
│  ┌───────────────────────────────────┐  │
│  │  React app (client/dist/)         │  │
│  │  - Renders UI                     │  │
│  │  - Manages local state            │  │
│  │  - Calls /api/* via fetch()       │  │
│  └──────────────┬────────────────────┘  │
└─────────────────┼───────────────────────┘
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────┐
│           Railway (cloud server)        │
│                                         │
│  Node.js / Express                      │
│  ┌───────────────────────────────────┐  │
│  │  server/index.js                  │  │
│  │  ├── /api/cars    (routes/cars)   │  │
│  │  ├── /api/bookings (routes/book.) │  │
│  │  └── /* → serves client/dist/    │  │
│  └──────────────┬────────────────────┘  │
│                 │ reads/writes          │
│  ┌──────────────▼────────────────────┐  │
│  │  db.json  (flat file database)    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Data Models

```
┌──────────────────────┐         ┌────────────────────────────┐
│         Car          │         │          Booking            │
├──────────────────────┤         ├────────────────────────────┤
│ id: number           │         │ id: number                 │
│ name: string         │         │ car_id: number             │
└──────────────────────┘         │ booker: string             │
           │                     │ all_day: boolean           │
           │ 1                   │ start_date: string         │
           │                     │ start_time: string         │
           │ many                │ end_date: string           │
           └────────────────────▶│ end_time: string           │
                                 │ note: string               │
                                 │ status: confirmed|cancelled│
                                 │ recurring_group_id: string │
                                 │ created_at: string         │
                                 └────────────────────────────┘
```

One Car can have many Bookings. Recurring bookings share the same
`recurring_group_id` so they can all be cancelled together.

---

## React Component Diagram (Frontend)

```
┌─────────────────────────────────────┐
│                App                  │
├─────────────────────────────────────┤
│ cars: Car[]                         │
│ bookings: Booking[]                 │
│ loading: boolean                    │
│ showAdd: boolean                    │
├─────────────────────────────────────┤
│ reload()                            │
│ handleAddCar(name)                  │
│ handleDeleteCar(id)                 │
└──────┬──────────┬───────────────────┘
       │          │
       ▼          ▼
┌────────────┐  ┌──────────────┐
│InstallButton│  │ AddCarModal  │
├────────────┤  ├──────────────┤
│prompt      │  │ name: string │
│installed   │  ├──────────────┤
│showIOSHelp │  │ onAdd()      │
├────────────┤  │ onClose()    │
│handleInstall│ └──────────────┘
└────────────┘

┌──────────────────────────────────────┐
│               CarItem                │
├──────────────────────────────────────┤
│ car: Car                             │
│ bookings: Booking[]                  │
│ showBook: boolean                    │
├──────────────────────────────────────┤
│ handleCancel(id)                     │
│ handleCancelGroup(groupId)           │
└───────────────┬──────────────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
┌──────────────┐  ┌─────────────────────────┐
│   Calendar   │  │      BookingModal        │
├──────────────┤  ├─────────────────────────┤
│bookings:     │  │ booker: string           │
│  Booking[]   │  │ allDay: boolean          │
│year: number  │  │ recurring: boolean       │
│month: number │  │ startDate: string        │
├──────────────┤  │ startTime: string        │
│prev()        │  │ endDate: string          │
│next()        │  │ endTime: string          │
│pillLabel()   │  │ recurDays: number[]      │
│nameColor()   │  │ recurFrom: string        │
└──────────────┘  │ recurUntil: string       │
                  ├─────────────────────────┤
                  │ handleCheck()            │
                  │ handleSubmit()           │
                  │ toggleDay(val)           │
                  └─────────────────────────┘
```

---

## Server Module Diagram (Backend)

```
┌─────────────────────────────┐
│         index.js            │
│         (Express app)       │
├─────────────────────────────┤
│ Mounts /api/cars            │
│ Mounts /api/bookings        │
│ Serves client/dist/         │
└──────┬──────────────────────┘
       │
       ├──────────────────────────────────────┐
       │                                      │
       ▼                                      ▼
┌─────────────────────┐         ┌─────────────────────────┐
│     routes/cars     │         │    routes/bookings       │
├─────────────────────┤         ├─────────────────────────┤
│ GET    /            │         │ GET    /                 │
│ POST   /            │         │ POST   / (single)        │
│ DELETE /:id         │         │ POST   / (recurring)     │
│ GET    /:id/avail.  │         │ DELETE /:id              │
└──────┬──────────────┘         │ DELETE /group/:group_id  │
       │                        └───────────┬─────────────┘
       └──────────────┬─────────────────────┘
                      │ both use
                      ▼
          ┌───────────────────────┐
          │         db.js         │
          ├───────────────────────┤
          │ getCars()             │
          │ getCarById(id)        │
          │ addCar(name)          │
          │ deleteCar(id)         │
          │ getBookings(carId)    │
          │ getBookingById(id)    │
          │ hasConflict(...)      │
          │ createBooking(data)   │
          │ cancelBooking(id)     │
          │ cancelGroup(groupId)  │
          └───────────┬───────────┘
                      │ reads/writes
                      ▼
              ┌───────────────┐
              │   db.json     │
              │  (database)   │
              └───────────────┘
```

---

## API Endpoints

| Method | URL | What it does |
|--------|-----|--------------|
| GET | /api/cars | List all cars |
| POST | /api/cars | Add a car |
| DELETE | /api/cars/:id | Remove a car |
| GET | /api/cars/:id/availability | Check if car is free for given times |
| GET | /api/bookings | List all bookings |
| POST | /api/bookings | Create a booking (single or recurring) |
| DELETE | /api/bookings/:id | Cancel one booking |
| DELETE | /api/bookings/group/:id | Cancel a whole recurring series |

---

## Layer Summary

| Layer | Files | Responsibility |
|-------|-------|----------------|
| Data | `Car`, `Booking` | What gets stored |
| Frontend | `App`, `CarItem`, `Calendar`, `BookingModal`, `AddCarModal`, `InstallButton` | What the user sees |
| Backend routes | `cars.js`, `bookings.js` | Handle incoming requests |
| Backend data | `db.js` | Read/write the database |
| Database | `db.json` | Store everything |
| Hosting | Railway | Runs the server 24/7 |
| Code storage | GitHub | Stores the code, triggers deploys |
