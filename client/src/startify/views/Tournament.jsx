import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, MapPin, Users, Share2, Crown, Braces } from 'lucide-react'

export default function Tournament(){
  const { slug } = useParams()
  return (
    <div className="container-xl py-8">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">{slug.replaceAll('-', ' ').toUpperCase()}</h1>
                <p className="text-white/70 mt-1">Hosted by Startify • Online • APAC</p>
              </div>
              <button className="btn-outline"><Share2 className="h-4 w-4"/> Share</button>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold mb-3">Overview</h3>
            <p className="text-white/80">This page mirrors start.gg detail layout: overview, schedule, events, and a bracket shortcut. Replace with your API data.</p>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white/5 rounded-xl p-4">
                <Calendar className="h-4 w-4 mb-2 text-white/70"/>
                <div className="text-sm text-white/60">Date</div>
                <div className="font-medium">Jan 12 – Mar 24</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <MapPin className="h-4 w-4 mb-2 text-white/70"/>
                <div className="text-sm text-white/60">Region</div>
                <div className="font-medium">APAC</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <Users className="h-4 w-4 mb-2 text-white/70"/>
                <div className="text-sm text-white/60">Participants</div>
                <div className="font-medium">1200</div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold mb-3">Events</h3>
            <div className="space-y-3">
              {["Main Event", "Qualifier 1", "Qualifier 2"].map((n,i)=>(
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 grid place-items-center">
                      <Crown className="h-5 w-5 text-white"/>
                    </div>
                    <div>
                      <div className="font-medium">{n}</div>
                      <div className="text-xs text-white/60">Single Elimination • Best of 3</div>
                    </div>
                  </div>
                  <Link to="#" className="btn-outline"><Braces className="h-4 w-4"/> View Bracket</Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h4 className="font-semibold mb-2">Register</h4>
            <button className="btn-primary w-full">Join Tournament</button>
            <button className="btn-outline w-full mt-2">Request Team Slot</button>
          </div>
          <div className="card p-5">
            <h4 className="font-semibold mb-2">Rules</h4>
            <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
              <li>Players must verify Discord identity</li>
              <li>Match results must be reported within 15 minutes</li>
              <li>No cheating or unauthorized software</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
