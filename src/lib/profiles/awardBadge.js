/**
 * MYSTATION — Badge Award Logic
 * Server-side: checks criteria and awards badges
 */

export async function checkAndAwardBadges(supabase, userId, context) {
  const awarded = [];

  const { data: existing } = await supabase
    .from('badges')
    .select('badge_id')
    .eq('user_id', userId);

  const has = new Set((existing || []).map(b => b.badge_id));

  async function award(badgeId) {
    if (has.has(badgeId)) return;
    const { error } = await supabase
      .from('badges')
      .insert({ user_id: userId, badge_id: badgeId })
      .select()
      .single();
    if (!error) {
      awarded.push(badgeId);
      await supabase.from('activity_feed').insert({
        user_id: userId,
        type: 'badge_earned',
        data: { badge_id: badgeId },
      });
    }
  }

  if (context.type === 'game_result') {
    if (context.isWinner) {
      await award('first_win');
    }

    if (context.stats) {
      const wins = context.stats.wins + (context.isWinner ? 1 : 0);
      if (context.gameType === 'dominoes' && wins >= 10) await award('domino_master');
      if (context.gameType === 'blackjack' && wins >= 10) await award('card_shark');
      if (context.gameType === 'spades' && wins >= 10) await award('spades_ace');
      if (context.gameType === 'pool' && wins >= 10) await award('pool_hustler');
    }

    if (context.newStreak >= 5) {
      await award('streak_5');
    }

    if (context.gameType === 'quiz' && context.perfectQuiz) {
      await award('quiz_brain');
    }

    if (context.isWinner) {
      await supabase.from('activity_feed').insert({
        user_id: userId,
        type: 'game_win',
        data: { game_type: context.gameType },
      });
    }
  }

  if (context.type === 'subscription') {
    await award('subscriber');
    if (context.tier === 'diamond') await award('diamond');
  }

  if (context.type === 'first_listen') {
    await award('first_listen');
  }

  return awarded;
}
