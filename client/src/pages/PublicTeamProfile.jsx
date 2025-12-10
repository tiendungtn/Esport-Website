import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "../styles/pages/public-team-profile.css";

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

  if (loading) return <div className="ptp-loading">Loading...</div>;
  if (error) return <div className="ptp-error">{error}</div>;
  if (!team) return <div className="ptp-loading">Team not found</div>;

  return (
    <div className="ptp-container">
      <div className="ptp-header">
        {team.logoUrl ? (
          <img src={team.logoUrl} alt={team.name} className="ptp-logo" />
        ) : (
          <div className="ptp-logo-placeholder">
            {(team.name || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="ptp-name">{team.name}</h1>
          {team.tag && <span className="ptp-tag">{team.tag}</span>}
          {team.game && <div className="ptp-game">{team.game}</div>}
        </div>
      </div>

      <div className="ptp-roster-section">
        <h2 className="ptp-roster-title">Roster</h2>
        <div className="ptp-roster-grid">
          {team.members && team.members.length > 0 ? (
            team.members.map((member) => (
              <div key={member._id} className="ptp-member-card">
                <div className="ptp-member-avatar-container">
                  {/* Placeholder nếu không có ảnh profile */}
                  <div className="ptp-member-avatar-placeholder">
                    {member.profile?.name
                      ? member.profile.name.charAt(0).toUpperCase()
                      : "?"}
                  </div>
                </div>
                <div>
                  <div className="ptp-member-name">
                    {member.profile?.name || "Unknown"}
                  </div>
                  <div className="ptp-member-email">{member.email}</div>
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
