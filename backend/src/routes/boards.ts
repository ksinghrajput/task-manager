import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
router.use(authenticate);

// GET /api/boards
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT b.*, u.name as owner_name,
        (SELECT COUNT(*) FROM board_members bm2 WHERE bm2.board_id = b.id)::int as member_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.board_id = b.id)::int as task_count,
        bm.role as my_role
       FROM boards b
       JOIN users u ON b.owner_id = u.id
       JOIN board_members bm ON bm.board_id = b.id AND bm.user_id = $1
       WHERE b.is_archived = false
       ORDER BY b.updated_at DESC`,
      [req.user!.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch boards' });
  }
});

// POST /api/boards
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, color = '#0057FF', icon = '📋' } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ message: 'Board name is required' });
      return;
    }
    const boardResult = await query(
      'INSERT INTO boards (name, description, color, icon, owner_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name.trim(), description || null, color, icon, req.user!.userId]
    );
    const board = boardResult.rows[0];
    await query('INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3)', [
      board.id,
      req.user!.userId,
      'admin',
    ]);
    const defaultColumns = [
      { name: 'Backlog', color: '#6e6e6e', position: 0 },
      { name: 'To Do', color: '#0057FF', position: 1 },
      { name: 'In Progress', color: '#f59e0b', position: 2 },
      { name: 'In Review', color: '#8b5cf6', position: 3 },
      { name: 'Done', color: '#10b981', position: 4 },
    ];
    for (const col of defaultColumns) {
      await query(
        'INSERT INTO columns (board_id, name, color, position) VALUES ($1, $2, $3, $4)',
        [board.id, col.name, col.color, col.position]
      );
    }
    res.status(201).json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create board' });
  }
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/boards/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!UUID_RE.test(id as string)) {
      res.status(400).json({ message: 'Invalid board ID' });
      return;
    }
    const access = await query(
      'SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2',
      [id, req.user!.userId]
    );
    if (access.rows.length === 0) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    const boardResult = await query(
      `SELECT b.*, u.name as owner_name FROM boards b JOIN users u ON b.owner_id = u.id WHERE b.id = $1`,
      [id]
    );
    if (boardResult.rows.length === 0) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }
    const board = boardResult.rows[0];
    const columnsResult = await query(
      'SELECT * FROM columns WHERE board_id = $1 ORDER BY position ASC',
      [id]
    );
    const tasksResult = await query(
      `SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar, r.name as reporter_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN users r ON t.reporter_id = r.id
       WHERE t.board_id = $1
       ORDER BY t.position ASC`,
      [id]
    );
    const membersResult = await query(
      `SELECT u.id, u.name, u.email, u.avatar, bm.role
       FROM board_members bm
       JOIN users u ON u.id = bm.user_id
       WHERE bm.board_id = $1`,
      [id]
    );
    res.json({
      ...board,
      columns: columnsResult.rows,
      tasks: tasksResult.rows,
      members: membersResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch board' });
  }
});

// PATCH /api/boards/:id
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!UUID_RE.test(id as string)) { res.status(400).json({ message: 'Invalid board ID' }); return; }
    const { name, description, color, icon } = req.body;
    const access = await query(
      'SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2',
      [id, req.user!.userId]
    );
    if (access.rows.length === 0 || access.rows[0].role !== 'admin') {
      res.status(403).json({ message: 'Only admins can update boards' });
      return;
    }
    const result = await query(
      `UPDATE boards SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        color = COALESCE($3, color),
        icon = COALESCE($4, icon)
       WHERE id = $5 RETURNING *`,
      [name, description, color, icon, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update board' });
  }
});

// DELETE /api/boards/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!UUID_RE.test(id as string)) { res.status(400).json({ message: 'Invalid board ID' }); return; }
    const board = await query('SELECT owner_id FROM boards WHERE id = $1', [id]);
    if (board.rows.length === 0 || board.rows[0].owner_id !== req.user!.userId) {
      res.status(403).json({ message: 'Only the board owner can delete it' });
      return;
    }
    await query('UPDATE boards SET is_archived = true WHERE id = $1', [id]);
    res.json({ message: 'Board archived' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to archive board' });
  }
});

// POST /api/boards/:id/members
router.post('/:id/members', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, role = 'member' } = req.body;
    const access = await query(
      'SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2',
      [id, req.user!.userId]
    );
    if (access.rows.length === 0 || access.rows[0].role !== 'admin') {
      res.status(403).json({ message: 'Only admins can add members' });
      return;
    }
    const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    await query(
      'INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (board_id, user_id) DO UPDATE SET role = $3',
      [id, userResult.rows[0].id, role]
    );
    res.json({ message: 'Member added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add member' });
  }
});

// GET /api/boards/:id/activity
router.get('/:id/activity', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT al.*, u.name as user_name, u.avatar as user_avatar
       FROM activity_logs al
       JOIN users u ON al.user_id = u.id
       WHERE al.board_id = $1
       ORDER BY al.created_at DESC
       LIMIT 50`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch activity' });
  }
});

export default router;
