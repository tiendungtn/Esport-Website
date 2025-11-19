import React from 'react'
import EventCardV2 from '../ui/EventCardV2'
import SectionHeader from '../ui/SectionHeader'
import { ChevronRight } from 'lucide-react'

const featured = [
  { title: "Port Priority 9", game: "Super Smash Bros. Ultimate", date: "Nov 8th - Nov 9th, 2025", location: "Seattle, WA", attendees: 556, ribbon: "Registration Open" },
  { title: "World Warrior 2025 - Japan 4", game: "Street Fighter 6", date: "Nov 30th - Dec 30th, 2025", location: "Online", attendees: 532, ribbon: "Registration Open" },
  { title: "Frosty Faustings XVIII 2026", game: "FGC", date: "Jan 29th - Feb 1st, 2026", location: "Lombard, IL", attendees: 220, ribbon: "Registration Open" },
  { title: "TEKKEN World Tour 2025 Global...", game: "TEKKEN 8", date: "Jan 31st - Feb 1st, 2026", location: "Malmo, SE", attendees: 145, ribbon: "Registration Open" },
  { title: "Genesis X", game: "SSBU + Melee", date: "Jan 31st - Feb 2nd, 2026", location: "San Jose, CA", attendees: 7476, ribbon: "Registration Open" },
]

const online = [
  { title: "The Next Battles", game: "TEKKEN 8", date: "Nov 8th, 2025", location: "Online", attendees: 11, ribbon: "Registration Closing Soon" },
  { title: "The Apex Nationals Qualifier", game: "Rocket League", date: "Nov 9th, 2025", location: "Online", attendees: 25, ribbon: "Registration Closing Soon" },
  { title: "Yousuke Dojo #38", game: "SSBU", date: "Nov 9th, 2025", location: "Online", attendees: 13, ribbon: "Registration Closing Soon" },
  { title: "WANTED DEFZ #223", game: "DBFZ", date: "Nov 9th, 2025", location: "Online", attendees: 64, ribbon: "Registration Closing Soon" },
  { title: "The Jocky Academy 25", game: "Guilty Gear -Strive-", date: "Nov 9th, 2025", location: "Online", attendees: 4, ribbon: "Registration Closing Soon" },
]

const upcoming = [
  { title: "The Cashbox", game: "SSBU", date: "Nov 9th, 2025", location: "Nijmegen, NL", attendees: 8, ribbon: "Registration Closing Soon" },
  { title: "Manila Madness 4", game: "TEKKEN 8", date: "Nov 9th, 2025", location: "PH", attendees: 324, ribbon: "Registration Closing Soon" },
  { title: "R.I.S.C 2 2025 (Rumble in NRG...)", game: "MLBB", date: "Nov 9th, 2025", location: "VN", attendees: 219 },
  { title: "FAST FALLS 2025", game: "SSBU", date: "Nov 9th, 2025", location: "SG", attendees: 79 },
  { title: "RLCS 2026 - Europe Open 1", game: "Rocket League", date: "Nov 15th - Dec 7th, 2025", location: "EU", attendees: 2676 },
]

const finished = new Array(10).fill(0).map((_,i)=> ({
  title: `Finished Event ${i+1}`, game: "Various", date: "Nov 2nd - Nov 4th, 2025", location: "USA", attendees: 1200
}))

export default function HomeLanding(){
  return (
    <div className="bg-slate-50 text-slate-900">
      {/* Top wave / hero */}
      <div className="bg-[#0b6fc2]">
        <div className="max-w-7xl mx-auto px-4 pt-10 pb-16 text-center">
          <div className="text-white text-4xl font-bold">start.gg</div>
          <p className="text-white/90 mt-2">Community through competition</p>
          <div className="mt-5 flex gap-3 justify-center">
            <a className="inline-flex items-center rounded-full bg-white text-[#0b6fc2] font-semibold px-4 py-2 hover:bg-slate-100" href="#">Create an event</a>
            <a className="inline-flex items-center rounded-full bg-[#085ea5] text-white font-semibold px-4 py-2 hover:bg-[#0a68b6]" href="#">Find events</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured Events */}
        <div className="mt-2">
          <SectionHeader
            title="Featured events"
            action={<div className="flex items-center gap-3 text-[13px]">
              <label className="text-slate-500">Choose your game</label>
              <select className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700">
                <option>All</option>
                <option>SSBU</option>
                <option>TEKKEN 8</option>
                <option>Rocket League</option>
              </select>
            </div>}
          />
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {featured.map((it,idx)=>(<EventCardV2 key={idx} item={it}/>))}
          </div>
        </div>

        {/* Circuits & Leagues (static row) */}
        <div className="mt-10">
          <SectionHeader title="Circuits and leagues" action={<a className="text-sky-700 font-medium inline-flex items-center gap-1" href="#">
            View all <ChevronRight className="h-4 w-4"/>
          </a>} />
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {new Array(5).fill(0).map((_,i)=>(
              <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition">
                <div className="aspect-[16/9] bg-gradient-to-br from-slate-300 to-slate-200"/>
                <div className="p-3">
                  <div className="font-semibold">League Card {i+1}</div>
                  <div className="mt-1 text-[12px] text-slate-600">Subtitle / time range</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Online */}
        <div className="mt-10">
          <SectionHeader title="Online" />
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {online.map((it,idx)=>(<EventCardV2 key={idx} item={it}/>))}
          </div>
        </div>

        {/* Upcoming */}
        <div className="mt-10">
          <SectionHeader title="Upcoming" action={<a className="text-sky-700 font-medium inline-flex items-center gap-1" href="#">
            View all <ChevronRight className="h-4 w-4"/>
          </a>} />
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {upcoming.map((it,idx)=>(<EventCardV2 key={idx} item={it}/>))}
          </div>
        </div>

        {/* Recently finished */}
        <div className="mt-10">
          <SectionHeader title="Recently finished" action={<a className="text-sky-700 font-medium inline-flex items-center gap-1" href="#">
            View all <ChevronRight className="h-4 w-4"/>
          </a>} />
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {finished.map((it,idx)=>(<EventCardV2 key={idx} item={it}/>))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-white mt-10">
        <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-5 gap-8 text-[13px] text-slate-600">
          <div className="col-span-2">
            <div className="text-slate-900 font-semibold">start.gg</div>
            <p className="mt-2">Community through competition</p>
          </div>
          <div>
            <div className="text-slate-900 font-semibold">start.gg</div>
            <ul className="mt-2 space-y-1">
              <li><a className="hover:text-slate-900" href="#">Create Tournament</a></li>
              <li><a className="hover:text-slate-900" href="#">Rankings</a></li>
              <li><a className="hover:text-slate-900" href="#">Privacy Policy</a></li>
              <li><a className="hover:text-slate-900" href="#">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <div className="text-slate-900 font-semibold">Discover</div>
            <ul className="mt-2 space-y-1">
              <li><a className="hover:text-slate-900" href="#">Tournaments</a></li>
              <li><a className="hover:text-slate-900" href="#">Rankings</a></li>
              <li><a className="hover:text-slate-900" href="#">Fantasy</a></li>
            </ul>
          </div>
          <div>
            <div className="text-slate-900 font-semibold">Help</div>
            <ul className="mt-2 space-y-1">
              <li><a className="hover:text-slate-900" href="#">Help Center</a></li>
              <li><a className="hover:text-slate-900" href="#">Contact Support</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
