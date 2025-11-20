import React from "react";
import { Routes, Route } from "react-router-dom";
import "./styles/globals.css";
import RootLayout from "./ui/RootLayout";

export default function StartifyShell() {
  return (
    <RootLayout>
      <Routes></Routes>
    </RootLayout>
  );
}
