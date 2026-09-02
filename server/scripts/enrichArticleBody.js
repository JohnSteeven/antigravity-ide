const mongoose = require("mongoose");
const connectDb = require("../config/db");
const Article = require("../models/Article");

async function enrichArticle() {
  console.log("\n========================================================");
  console.log("Enriching Featured Article Body with Rich Media Blocks");
  console.log("========================================================\n");

  await connectDb();

  const article = await Article.findOne({ title: /The Mountain You Fear/i });
  if (!article) {
    console.error("Article not found!");
    process.exit(1);
  }

  const enrichedBody = `
<p>There is a strange truth about life that many of us only discover after years of chasing comfort: the greatest opportunities for growth are usually hidden behind the challenges we fear the most.</p>
<p>We naturally avoid uncertainty. We postpone difficult conversations, delay ambitious goals, and convince ourselves that "someday" will be the perfect time to begin. But life has a quiet way of reminding us that comfort is rarely where transformation happens.</p>

<h2>A Decision to Make</h2>
<p>Several years ago, I stood at the edge of one of the biggest decisions of my life. From the outside, everything appeared stable. I had a predictable routine, familiar surroundings, and enough certainty to feel safe. Yet deep inside, I knew something was missing.</p>

<div class="callout-note">
  <p><strong>Note:</strong> Routine is comfortable, but comfort can quietly become a cage that limits our potential. Transformation begins at the end of your comfort zone.</p>
</div>

<p>Every day felt identical to the one before it. Wake up, work, eat, sleep, repeat. There was nothing wrong with that life, yet nothing truly inspiring about it either.</p>

<h2>The Climb Begins</h2>
<p>One weekend, I decided to hike a nearby mountain. It wasn't famous, nor was it particularly difficult, but it had a reputation for exhausting beginners. Standing at the base, I looked toward the summit and immediately questioned whether I had made the right decision.</p>

<div class="article-image-container">
  <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80" alt="Majestic Mountain Summit View" />
  <span class="image-caption">The mountain standing ahead — a silent challenge waiting to be met.</span>
</div>

<h3>First Steps</h3>
<p>The climb began gently. The first few hundred meters were easy. The path was wide, the weather was pleasant, and my confidence was high.</p>

<h3>The Trail Changes</h3>
<p>Then the trail changed. The ground became uneven, the slope became steeper, and every step demanded more effort than the last. Soon, my excitement was replaced by frustration. I stopped several times, wondering if turning back would be the smarter choice.</p>

<p>As I rested beside a large rock, an older hiker slowly walked past me. He wasn't particularly fast, and he wasn't carrying expensive equipment, but he simply kept walking. Curious, I eventually caught up with him and asked, "How do you keep going without getting tired?"</p>

<blockquote>
  "I get tired," he smiled. "I just don't let being tired decide where I stop."
  <cite>— The Wise Hiker</cite>
</blockquote>

<p>That sentence stayed with me long after the hike ended. Back in everyday life, I realized how often I had allowed temporary discomfort to make permanent decisions.</p>

<div class="callout-tip">
  <p><strong>Growth Tip:</strong> Next time you feel afraid of trying something meaningful, ask yourself: <em>"What happens if I don't try?"</em> The cost of stagnation is often far greater than the cost of failure.</p>
</div>

<h2>The Meaning of Growth</h2>
<p>Growth is not about becoming fearless. It is about learning to move even when fear walks beside you. The people we admire are rarely fearless. Entrepreneurs experience uncertainty, writers face self-doubt, and athletes lose confidence. What separates them from everyone else is not the absence of fear—it is their willingness to continue despite it.</p>

<div class="article-image-container">
  <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80" alt="Lush Forest Trail and Valley View" />
  <span class="image-caption">Every breathtaking view is earned through thousands of small, daily choices.</span>
</div>

<p>One of the greatest misconceptions about personal growth is the belief that change happens in dramatic moments. In reality, transformation is incredibly ordinary. It happens in micro-choices:</p>

<ul class="checklist">
  <li>Choosing to read or learn instead of mindlessly scrolling social media.</li>
  <li>Choosing to listen and empathize instead of arguing to win.</li>
  <li>Choosing to forgive and move forward instead of holding onto resentments.</li>
  <li>Choosing to wake up early to work on your dream instead of hitting snooze.</li>
</ul>

<p>Those tiny choices rarely feel important in the moment. Yet over months and years, they quietly shape the person you become.</p>

<h2>Returning to the Mountain</h2>
<p>Years after that first hike, I returned to the same mountain. The trail hadn't changed, the rocks were still there, and the climb was just as steep. But I was different. The mountain had never become easier; I had become stronger.</p>

<div class="callout-success">
  <p><strong>Key Takeaway:</strong> Life rarely removes the obstacles. Instead, it quietly transforms the person walking toward them.</p>
</div>

<p>So if there is a mountain standing in front of you today—a difficult decision, an ambitious dream, a conversation you've been avoiding, or a challenge that feels too large—remember this: You do not have to conquer it all today. You only need enough courage to take the next step.</p>
`;

  article.body = enrichedBody.trim();
  await article.save();

  console.log(`✓ Enriched body for "${article.title}" successfully with 2 inline images, blockquotes, callouts, and checklists.`);

  await mongoose.connection.close();
  process.exit(0);
}

enrichArticle().catch((err) => {
  console.error("❌ Enrichment Failed:", err);
  process.exit(1);
});
