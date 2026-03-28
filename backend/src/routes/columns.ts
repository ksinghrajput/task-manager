import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
router.use(authenticate);

// POST /api/columns
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { board_id, name, color = '#e0e0e0' } = req.body;
    if (!board_id || !name?.trim()) {
      res.status(400).json({ message: 'board_id and name are required' });
      return;
    }
    const access = await query(
      'SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2',
      [board_id, req.user!.userId]
    );
    if (access.rows.length === 0 || !['admin', 'member'].includes(access.rows[0].role)) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    const posResult = await query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM columns WHERE board_id = $1',
      [board_id]
    );
    const result = await query(
      'INSERT INTO columns (board_id, name, color, position) VALUES ($1, $2, $3, $4) RETURNING *',
      [board_id, name.trim(), color, posResult.rows[0].next_pos]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create column' });
  }
});

// PATCH /api/columns/:id
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    const result = await query(
      'UPDATE columns SET name = COALESCE($1, name), color = COALESCE($2, color) WHERE id = $3 RETURNING *',
      [name || null, color || null, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Column not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update column' });
  }
});

// DELETE /api/columns/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const colResult = await query('SELECT board_id FROM columns WHERE id = $1', [id]);
    if (colResult.rows.length === 0) {
      res.status(404).json({ message: 'Column not found' });
      return;
    }
    const access = await query(
      'SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2',
      [colResult.rows[0].board_id, req.user!.userId]
    );
    if (access.rows.length === 0 || access.rows[0].role !== 'admin') {
      res.status(403).json({ message: 'Only admins can delete columns' });
      return;
    }
    await query('DELETE FROM columns WHERE id = $1', [id]);
    res.json({ message: 'Column deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete column' });
  }
});

export default router;
