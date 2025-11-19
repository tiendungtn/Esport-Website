import React from 'react'
import { Routes, Route } from 'react-router-dom'
import './styles/globals.css'
import RootLayout from './ui/RootLayout'
import Home from './views/Home'
import Tournament from './views/Tournament'
import Player from './views/Player'
import Organization from './views/Organization'
import HomeLanding from './views/HomeLanding'

export default function StartifyShell(){
  return (
    <RootLayout>
      <Routes>
        <Route path='/' element={<HomeLanding/>}/>
        <Route path='/tournament/:slug' element={<Tournament/>}/>
        <Route path='/player/:id' element={<Player/>}/>
        <Route path='/org/:slug' element={<Organization/>}/>
      </Routes>
    </RootLayout>
  )
}
