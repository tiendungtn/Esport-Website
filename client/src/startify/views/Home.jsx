import React from 'react'
import TournamentCard from '../ui/TournamentCard'
import FilterBar from '../ui/FilterBar'
import { Flame, Clock3, CirclePlay } from 'lucide-react'

const sample = [
  { slug: "vct-pacific-2025", title: "VCT Pacific 2025", game: "VALORANT", region: "APAC", date: "Jan 12 - Mar 24", players: 1200, prize: "$250,000", status: "live" },
  { slug: "mlbb-mpl-s16", title: "MPL Season 16", game: "MLBB", region: "SEA", date: "Oct 02 - Nov 30", players: 860, prize: "$150,000", status: "upcoming" },
  { slug: "the-international-2025", title: "The International 2025", game: "Dota 2", region: "EU", date: "Aug 10 - Aug 25", players: 120, prize: "$5,000,000", status: "past" },
  { slug: "pubg-nations", title: "PUBG Nations Cup", game: "PUBG", region: "Global", date: "May 04 - May 11", players: 64, prize: "$300,000", status: "past" },
]

export default function Home(){
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(40%_40%_at_50%_0%,rgba(14,165,233,.35),transparent)] pointer-events-none"/>
        <div className="container-xl py-16">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Discover & run esports tournaments</h1>
          <p className="text-white/70 mt-3 max-w-2xl">A start.gg‑style interface with modern Tailwind components, tabs, cards, and filters—ready to hook into your backend.</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="badge"><Flame className="h-4 w-4"/> Trending now</span>
            <span className="badge"><CirclePlay className="h-4 w-4"/> Live events</span>
            <span className="badge"><Clock3 className="h-4 w-4"/> This week</span>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="container-xl">
        <div className="card p-4 md:p-5">
          <FilterBar/>
        </div>
      </div>

      {/* Tabs + Grid */}
      <section id="trending" className="container-xl mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Featured Tournaments</h2>
          <a className="nav-link text-sm" href="#">View all</a>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
          {sample.map(t => <TournamentCard key={t.slug} data={t}/>)}
        </div>
      </section>
    </div>
  )
}
