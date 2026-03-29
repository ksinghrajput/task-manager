import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
router.use(authenticate);

// GET /api/tasks/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar, r.name as reporter_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN users r ON t.reporter_id = r.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    const comments = await query(
      `SELECT c.*, u.name as user_name, u.avatar as user_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json({ ...result.rows[0], comments: comments.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch task' });
  }
});

// POST /api/tasks
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, column_id, board_id, assignee_id, priority = 'medium', due_date, labels = [] } = req.body;
    if (!title?.trim() || !column_id || !board_id) {
      res.status(400).json({ message: 'title, column_id, and board_id are required' });
      return;
    }
    const access = await query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [board_id, req.user!.userId]
    );
    if (access.rows.length === 0) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    const posResult = await query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM tasks WHERE column_id = $1',
      [column_id]
    );
    const position = posResult.rows[0].next_pos;
    const result = await query(
      `INSERT INTO tasks (title, description, column_id, board_id, assignee_id, reporter_id, priority, due_date, position, labels)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        title.trim(),
        description || null,
        column_id,
        board_id,
        assignee_id || null,
        req.user!.userId,
        priority,
        due_date || null,
        position,
        labels,
      ]
    );
    await query(
      'INSERT INTO activity_logs (board_id, task_id, user_id, action) VALUES ($1, $2, $3, $4)',
      [board_id, result.rows[0].id, req.user!.userId, 'task_created']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, column_id, assignee_id, priority, due_date, labels } = req.body;

    const taskResult = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    const task = taskResult.rows[0];

    const access = await query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [task.board_id, req.user!.userId]
    );
    if (access.rows.length === 0) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    let newPosition = task.position;
    if (column_id && column_id !== task.column_id) {
      const posResult = await query(
        'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM tasks WHERE column_id = $1',
        [column_id]
      );
      newPosition = posResult.rows[0].next_pos;
    }

    const result = await query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        column_id = COALESCE($3, column_id),
        assignee_id = CASE WHEN $4::text IS NULL THEN assignee_id WHEN $4::text = '' THEN NULL ELSE $4::uuid END,
        priority = COALESCE($5, priority),
        due_date = CASE WHEN $6::text IS NULL THEN due_date ELSE $6::timestamptz END,
        labels = COALESCE($7::text[], labels),
        position = $8
       WHERE id = $9 RETURNING *`,
      [
        title || null,
        description !== undefined ? description : null,
        column_id || null,
        assignee_id !== undefined ? (assignee_id || '') : null,
        priority || null,
        due_date !== undefined ? (due_date || null) : null,
        labels || null,
        newPosition,
        id,
      ]
    );

    if (column_id && column_id !== task.column_id) {
      await query(
        'INSERT INTO activity_logs (board_id, task_id, user_id, action, meta) VALUES ($1, $2, $3, $4, $5)',
        [
          task.board_id,
          id,
          req.user!.userId,
          'task_moved',
          JSON.stringify({ from: task.column_id, to: column_id }),
        ]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const taskResult = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    const access = await query(
      'SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2',
      [taskResult.rows[0].board_id, req.user!.userId]
    );
    if (access.rows.length === 0) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    await query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      res.status(400).json({ message: 'Comment content is required' });
      return;
    }
    const result = await query(
      'INSERT INTO comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, req.user!.userId, content.trim()]
    );
    const comment = await query(
      `SELECT c.*, u.name as user_name, u.avatar as user_avatar
       FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = $1`,
      [result.rows[0].id]
    );
    res.status(201).json(comment.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

export default router;
