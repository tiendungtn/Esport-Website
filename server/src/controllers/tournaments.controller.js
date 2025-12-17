import { z } from "zod";
import Match from "../models/Match.js";
import Registration from "../models/Registration.js";
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import {
  seedingByRegistration
} from "../utils/bracket.js";

const createSchema = z.object({
  name: z.string().min(3),
  game: z.string().min(2),
  format: z.enum(["SE", "DE", "RR"]).default("SE"),
  maxTeams: z.number().int().min(2).max(128).default(16),
  description: z.string().optional(),
  schedule: z
    .object({
      regOpen: z.string().optional(),
      regClose: z.string().optional(),
    })
    .optional(),
});

export async function createTournament(req, res) {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) {
    console.log("Validation error:", parse.error);
    return res.status(400).json({ message: "Invalid payload" });
  }

  // Chuyển đổi chuỗi schedule sang đối tượng Date
  const tournamentData = { ...parse.data };
  if (parse.data.schedule) {
    tournamentData.schedule = {};
    if (parse.data.schedule.regOpen) {
      tournamentData.schedule.regOpen = new Date(parse.data.schedule.regOpen);
    }
    if (parse.data.schedule.regClose) {
      tournamentData.schedule.regClose = new Date(parse.data.schedule.regClose);
    }
  }

  console.log("Tạo giải đấu với:", tournamentData); // Log debug

  const t = await Tournament.create({
    ...tournamentData,
    status: "open",
    organizerUser: req.user?.id ?? null,
  });

  res.status(201).json(t);
}

export async function listTournaments(req, res) {
  const { status, game } = req.query;
  const query = {};
  if (status) query.status = status;
  if (game) query.game = game;

  const tournaments = await Tournament.find(query)
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(tournaments);
}

export async function getTournament(req, res) {
  const { id } = req.params;
  const t = await Tournament.findById(id);
  if (!t) return res.status(404).json({ message: "Tournament not found" });
  res.json(t);
}

export async function updateTournament(req, res) {
  const { id } = req.params;
  const parse = createSchema.partial().safeParse(req.body);
  if (!parse.success) {
    console.log("Validation error:", parse.error);
    return res.status(400).json({ message: "Invalid payload" });
  }

  const query = { _id: id };
  if (req.user.role !== "admin") {
    query.organizerUser = req.user.id;
  }

  // Xây dựng đối tượng cập nhật, xử lý schedule lồng nhau đúng cách
  const updateData = { ...parse.data };

  // Nếu schedule được cung cấp, chuyển sang đối tượng Date và sử dụng ký hiệu chấm
  if (parse.data.schedule) {
    const scheduleUpdates = {};
    if (parse.data.schedule.regOpen) {
      scheduleUpdates["schedule.regOpen"] = new Date(
        parse.data.schedule.regOpen
      );
    }
    if (parse.data.schedule.regClose) {
      scheduleUpdates["schedule.regClose"] = new Date(
        parse.data.schedule.regClose
      );
    }

    // Xóa schedule khỏi cập nhật chính và sử dụng ký hiệu chấm
    delete updateData.schedule;
    Object.assign(updateData, scheduleUpdates);
  }

  console.log("Cập nhật giải đấu với:", updateData); // Log debug

  const t = await Tournament.findOneAndUpdate(query, updateData, { new: true });
  if (!t)
    return res
      .status(404)
      .json({ message: "Tournament not found or unauthorized" });
  res.json(t);
}

export async function deleteTournament(req, res) {
  const { id } = req.params;

  const query = { _id: id };
  if (req.user.role !== "admin") {
    query.organizerUser = req.user.id;
  }

  const t = await Tournament.findOneAndDelete(query);
  if (!t)
    return res
      .status(404)
      .json({ message: "Tournament not found or unauthorized" });
  res.json({ message: "Tournament deleted" });
}

const registerSchema = z.object({
  teamId: z.string().min(1),
});

/**
 * Kiểm tra xung đột lịch thi đấu cho team
 * @param {string} teamId - ID của đội
 * @param {object} newTournament - Giải đấu mới muốn đăng ký
 * @param {object} options - Các tùy chọn
 * @param {boolean} options.includePending - Bao gồm cả đăng ký pending
 * @param {string} options.excludeTournamentId - ID giải đấu cần loại trừ
 * @returns {Promise<Array>} - Danh sách các giải đấu có xung đột
 */
async function checkScheduleConflict(teamId, newTournament, options = {}) {
  const { includePending = false, excludeTournamentId = null } = options;
  
  // Tìm các giải đấu mà team đã đăng ký
  const statusFilter = includePending 
    ? { $in: ["approved", "pending"] }
    : "approved";
  
  const registrationQuery = {
    teamId,
    status: statusFilter,
  };
  
  // Loại trừ giải đấu nếu được chỉ định (dùng khi approve)
  if (excludeTournamentId) {
    registrationQuery.tournamentId = { $ne: excludeTournamentId };
  }
  
  const registrations = await Registration.find(registrationQuery).lean();

  if (registrations.length === 0) return [];

  const tournamentIds = registrations.map((r) => r.tournamentId);

  // Lấy các giải đấu đang ongoing hoặc có lịch trùng
  const conflictConditions = [{ status: "ongoing" }];

  // Nếu giải đấu mới có thời gian startAt/endAt, kiểm tra overlap
  if (newTournament.schedule?.startAt && newTournament.schedule?.endAt) {
    conflictConditions.push({
      status: { $in: ["open", "ongoing"] },
      "schedule.startAt": { $lte: new Date(newTournament.schedule.endAt) },
      "schedule.endAt": { $gte: new Date(newTournament.schedule.startAt) },
    });
  }

  const conflictingTournaments = await Tournament.find({
    _id: { $in: tournamentIds, $ne: newTournament._id },
    $or: conflictConditions,
  }).lean();

  return conflictingTournaments;
}

const MIN_MEMBERS_MAPPING = {
  "League of Legends": 5,
  "Liên Minh Huyền Thoại": 5,
  "Wild Rift": 5,
  "Tốc Chiến": 5,
  "Arena of Valor": 5,
  "Liên Quân": 5,
  Valorant: 5,
  CS2: 5,
  "FC Online": 1,
};

const NORMALIZE_GAME_NAME = {
  "Liên Minh Huyền Thoại": "League of Legends",
  "League of Legends": "League of Legends",
  "Đấu Trường Chân Lý": "TFT",
  TFT: "TFT",
  "Liên Quân Mobile": "Arena of Valor",
  "Liên Quân": "Arena of Valor",
  "Arena of Valor": "Arena of Valor",
  "Tốc Chiến": "Wild Rift",
  "Wild Rift": "Wild Rift",
  Valorant: "Valorant",
  CS2: "CS2",
  "FC Online": "FC Online",
};

export async function registerTeam(req, res) {
  const { id } = req.params; // tournamentId
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    const tournament = await Tournament.findById(id);
    if (!tournament)
      return res.status(404).json({ message: "Tournament not found" });

    const team = await Team.findById(parse.data.teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Kiểm tra thời gian Registration
    if (
      tournament.schedule?.regClose &&
      new Date() > new Date(tournament.schedule.regClose)
    ) {
      return res.status(400).json({
        message: "Registration is closed for this tournament.",
      });
    }

    // Kiểm tra game phù hợp
    const teamGame = NORMALIZE_GAME_NAME[team.game] || team.game;
    const tourGame = NORMALIZE_GAME_NAME[tournament.game] || tournament.game;

    if (team.game && teamGame !== tourGame) {
      return res.status(400).json({
        message: `Team game (${team.game}) does not match tournament game (${tournament.game})`,
      });
    }

    // Kiểm tra số thành viên tối thiểu
    const minRequired = MIN_MEMBERS_MAPPING[tournament.game] || 1;
    if (team.members.length < minRequired) {
      return res.status(400).json({
        message: `Team must have at least ${minRequired} members to register for ${tournament.game}`,
      });
    }

    // Kiểm tra quyền người dùng (Chỉ chủ đội)
    if (team.ownerUser.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Only the team captain can register for tournaments",
      });
    }

    // Kiểm tra xung đột lịch thi đấu với các giải đã APPROVED (Block)
    const approvedConflicts = await checkScheduleConflict(
      parse.data.teamId,
      tournament,
      { includePending: false }
    );
    if (approvedConflicts.length > 0) {
      const conflictNames = approvedConflicts
        .map((t) => t.name)
        .join(", ");
      return res.status(409).json({
        message: `Schedule conflict detected. Team is already participating in: ${conflictNames}`,
        code: "SCHEDULE_CONFLICT",
        conflicts: approvedConflicts.map((t) => ({
          id: t._id,
          name: t.name,
          status: t.status,
        })),
      });
    }

    // Kiểm tra xung đột với các giải PENDING (Warning only)
    const pendingConflicts = await checkScheduleConflict(
      parse.data.teamId,
      tournament,
      { includePending: true }
    );

    const reg = await Registration.create({
      tournamentId: id,
      teamId: parse.data.teamId,
      status: "pending", // Chờ duyệt status: "pending"
    });

    // Trả về kết quả với warning nếu có xung đột pending
    const response = { ...reg.toObject() };
    if (pendingConflicts.length > 0) {
      response.warning = {
        message: `Potential schedule conflict with pending tournaments: ${pendingConflicts.map(t => t.name).join(", ")}`,
        code: "PENDING_SCHEDULE_CONFLICT",
        conflicts: pendingConflicts.map((t) => ({
          id: t._id,
          name: t.name,
          status: t.status,
        })),
      };
    }
    res.status(201).json(response);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Team already registered for this tournament" });
    }
    console.error(err);
    res.status(500).json({ message: "Could not register team" });
  }
}

const seedSchema = z.object({
  seeds: z
    .array(
      z.object({
        teamId: z.string(),
        seed: z.number().int().min(1),
      })
    )
    .optional(),
});

export async function seedTournament(req, res) {
  const { id } = req.params;

  // 1. Xác thực Payload
  const parse = seedSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }
  const manualSeeds = parse.data.seeds;

  // 2. Lấy tất cả đăng ký
  const regs = await Registration.find({ tournamentId: id }).sort({
    createdAt: 1,
  });

  if (manualSeeds && manualSeeds.length > 0) {
    // 3. Logic seeding thủ công
    // Kiểm tra: tất cả teamId phải thuộc giải đấu này
    const regTeamIds = new Set(regs.map((r) => r.teamId.toString()));
    const inputTeamIds = new Set(manualSeeds.map((s) => s.teamId));

    for (const inId of inputTeamIds) {
      if (!regTeamIds.has(inId)) {
        return res.status(400).json({
          message: `Team ID ${inId} is not registered for this tournament`,
        });
      }
    }

    // Kiểm tra: seed không được trùng nhau
    const seedValues = manualSeeds.map((s) => s.seed);
    const uniqueSeeds = new Set(seedValues);
    if (seedValues.length !== uniqueSeeds.size) {
      return res.status(400).json({
        message: "Không được đặt cùng seed (Duplicate seeds not allowed)",
      });
    }

    // Ánh xạ seed đầu vào
    const seedMap = new Map(); // teamId -> seed
    manualSeeds.forEach((s) => seedMap.set(s.teamId, s.seed));

    // Cập nhật registrations
    // Ghi chú: Những team không có trong manualSeeds sẽ có seed = null (hoặc giữ seed cũ nếu muốn, ở đây ta set theo logic yêu cầu)
    // Logic yêu cầu: "Nếu req.body.seeds được cung cấp, lặp qua các đăng ký và cập nhật trường seed dựa trên đầu vào."
    // Triển khai: Cập nhật đã cung cấp, các giá trị khác undefined? Hoặc báo lỗi nếu thiếu?
    // Thường seeding thủ công có nghĩa là seeding đầy đủ hoặc một phần. Giả sử cho phép một phần.
    // Yêu cầu nói: "lặp qua các đăng ký và cập nhật trường seed dựa trên đầu vào."
    // Đảm bảo lưu seed.
    await Promise.all(
      regs.map((r) => {
        const s = seedMap.get(r.teamId.toString());
        if (s !== undefined) {
          r.seed = s;
        } else {
          // Nếu không cung cấp, có thể giữ nguyên hoặc đặt null?
          // Để sạch: nếu chuyển sang thủ công, có thể cần bao phủ đầy đủ?
          // Sơ đồ người dùng ngụ ý gửi seeds cụ thể.
          // Chỉ cập nhật trận đấu.
        }
        return r.save();
      })
    );
  } else {
    // 4. Seeding tự động dự phòng (Sắp xếp theo createdAt)
    // regs đã được sắp xếp createdAt: 1 ở trên
    await Promise.all(
      regs.map((r, idx) => {
        r.seed = idx + 1;
        return r.save();
      })
    );
  }

  // Lấy lại để trả về trạng thái rõ ràng
  const updatedRegs = await Registration.find({ tournamentId: id }).sort({
    seed: 1,
  });
  res.json(updatedRegs);
}

/* Hàm hỗ trợ cho việc tạo bracket */
async function generateBracketInternal(tournamentId) {
  // Kiểm tra xem các trận đấu đã tồn tại chưa
  const existingMatches = await Match.countDocuments({ tournamentId });
  if (existingMatches > 0) {
    return { skipped: true, reason: "Bracket already exists" };
  }

  const regs = await Registration.find({
    tournamentId: tournamentId,
    status: "approved",
  }).lean();

  const seeds = seedingByRegistration(regs);
  if (seeds.length < 2) {
    return { skipped: true, reason: "Not enough teams to generate bracket" };
  }

  // Sử dụng thuật toán tạo bracket
  const { generateFullSEBracket } = await import("../utils/bracket.js");
  const matchesData = generateFullSEBracket(seeds, tournamentId);

  // Lưu vào DB
  const created = await Match.insertMany(matchesData);

  // Tùy chọn cập nhật trạng thái giải đấu
  await Tournament.findByIdAndUpdate(tournamentId, { status: "ongoing" });

  return { skipped: false, matches: created };
}

export async function generateBracket(req, res) {
  const { id } = req.params;

  // Kiểm tra đang chờ xử lý
  const pendingCount = await Registration.countDocuments({
    tournamentId: id,
    status: "pending",
  });

  if (pendingCount > 0) {
    return res.status(400).json({
      message: "Cannot generate bracket while there are pending registrations.",
    });
  }

  try {
    const result = await generateBracketInternal(id);
    if (result.skipped) {
      return res.status(400).json({ message: result.reason });
    }
    res.status(201).json({ matches: result.matches });
  } catch (error) {
    console.error("Bracket generation error:", error);
    res.status(500).json({ message: "Failed to generate bracket" });
  }
}

export async function getTournamentRegistrations(req, res) {
  const { id } = req.params;

  if (req.user.role !== "admin") {
    const tournament = await Tournament.findById(id);
    if (!tournament)
      return res.status(404).json({ message: "Tournament not found" });
    if (tournament.organizerUser?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
  }

  const registrations = await Registration.find({ tournamentId: id })
    .populate("teamId") // Để lấy thông tin đội (tên, logo, thành viên...)
    .sort({ createdAt: -1 });

  res.json(registrations);
}

export async function updateRegistrationStatus(req, res) {
  const { id, regId } = req.params;
  const { status } = req.body; // 'đã duyệt' | 'từ chối' | 'đang chờ'

  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  // Lấy thông tin registration hiện tại
  const existingReg = await Registration.findOne({ _id: regId, tournamentId: id });
  if (!existingReg) {
    return res.status(404).json({ message: "Registration not found" });
  }

  // Lấy thông tin tournament
  const tournament = await Tournament.findById(id);
  if (!tournament) {
    return res.status(404).json({ message: "Tournament not found" });
  }

  // Kiểm tra quyền
  if (req.user.role !== "admin") {
    if (tournament.organizerUser?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
  }

  // Kiểm tra xung đột lịch khi APPROVE
  if (status === "approved" && existingReg.status !== "approved") {
    const conflicts = await checkScheduleConflict(
      existingReg.teamId,
      tournament,
      { includePending: false, excludeTournamentId: id }
    );
    
    if (conflicts.length > 0) {
      const conflictNames = conflicts.map((t) => t.name).join(", ");
      return res.status(409).json({
        message: `Cannot approve. Team has schedule conflict with: ${conflictNames}`,
        code: "APPROVAL_SCHEDULE_CONFLICT",
        conflicts: conflicts.map((t) => ({
          id: t._id,
          name: t.name,
          status: t.status,
        })),
      });
    }
  }

  const reg = await Registration.findOneAndUpdate(
    { _id: regId, tournamentId: id },
    { status },
    { new: true }
  );

  if (!reg) return res.status(404).json({ message: "Registration not found" });

  // Tự động tạo bracket nếu tất cả đăng ký đã được xử lý
  try {
    const pendingCount = await Registration.countDocuments({
      tournamentId: id,
      status: "pending",
    });

    if (pendingCount === 0) {
      console.log(
        `All registrations processed for tournament ${id}. Attempting to generate bracket...`
      );
      await generateBracketInternal(id);
    }
  } catch (err) {
    console.error("Auto bracket generation failed:", err);
  }

  res.json(reg);
}
