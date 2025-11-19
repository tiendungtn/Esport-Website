import React from 'react'
import { Users, CalendarDays, MapPin } from 'lucide-react'

export default function EventCardV2({item}){
  return (
    <a href={item.href || '#'} className="group block bg-white rounded-xl border border-slate-200 hover:shadow-md transition overflow-hidden">
      <div className="relative aspect-[16/9] bg-slate-200">
        {/* Placeholder banner */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-200" />
        {item.ribbon && (
          <div className="absolute left-2 top-2 text-[11px] font-semibold px-2 py-1 rounded bg-emerald-600 text-white shadow">
            {item.ribbon}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-[11px] text-slate-500">{item.game}</div>
        <div className="font-semibold text-slate-900 line-clamp-1">{item.title}</div>
        <div className="mt-1 flex gap-3 text-[12px] text-slate-600">
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5"/>{item.date}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5"/>{item.location}</span>
        </div>
        <div className="mt-2 text-[12px] text-slate-600 inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5"/>{item.attendees} Attendees
        </div>
      </div>
    </a>
  )
}
