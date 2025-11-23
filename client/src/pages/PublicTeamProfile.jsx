import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

export default function PublicTeamProfile() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await axios.get(`/api/teams/${id}`);
        setTeam(res.data);
      } catch (err) {
        setError("Failed to load team data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [id]);

  if (loading)
    return <div className="p-8 text-center text-slate-400">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
  if (!team)
    return <div className="p-8 text-center text-slate-400">Team not found</div>;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        {team.logoUrl ? (
          <img
            src={team.logoUrl}
            alt={team.name}
            className="h-24 w-24 rounded-lg object-cover shadow-lg"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-800 text-3xl font-bold text-slate-600">
            {team.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-slate-100">{team.name}</h1>
          {team.tag && (
            <span className="mt-2 inline-block rounded bg-slate-800 px-2 py-0.5 text-sm font-medium text-slate-400">
              {team.tag}
            </span>
          )}
          {team.game && (
            <div className="mt-2 text-sm text-sky-400 font-medium">
              {team.game}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-200">Roster</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {team.members && team.members.length > 0 ? (
            team.members.map((member) => (
              <div
                key={member._id}
                className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/50 p-3"
              >
                <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-700">
                  {/* Placeholder avatar if no profile image */}
                  <div className="flex h-full w-full items-center justify-center text-slate-400 font-bold">
                    {member.profile?.name
                      ? member.profile.name.charAt(0).toUpperCase()
                      : "?"}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-slate-200">
                    {member.profile?.name || "Unknown"}
                  </div>
                  <div className="text-xs text-slate-400">{member.email}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400">No members found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
