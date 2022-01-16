"use strict";

// Options.
var paint_stack_as_sequence = false;
var disable_card_dimming = false;
var reveal_computer_hand = false;
var use_custom_setup = false;
var log_strategizing = true;
var log_stack = true;
var computer_delay_ms = 1000;

// Constants.
const canvas_height=700;
const canvas_width=canvas_height;
const playcard_separation=10;
const playcard_width=canvas_width/10-playcard_separation;
const playcard_height=playcard_width*1.58;
const playcard_width_border=3;
const playcard_alpha_available=1;
const playcard_alpha_unavailable=0.3;
const starting_card_count=7;
const border_padding=5;
const USER_ACTION_INVALID=-1;
const USER_ACTION_DRAW=-2;
const USER_ACTION_PASS=-3
const playcard_corner_radius=8;
const unavailable_opacity=0.7;
const card_lines = (canvas_height/2)/(playcard_height+playcard_separation)
const cards_per_row = Math.floor((canvas_width+playcard_separation-2*border_padding)/(playcard_width+playcard_separation));
const log_stack_style = 'background-color:blue;color:white;font-weight:bold;';
const log_strategizing_style = 'background-color:green;color:white;font-weight:bold';

// https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-using-html-canvas
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke === 'undefined') {
    stroke = true;
  }
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }

}

function get_rgba(color, a)
{
  switch (color) {
    case "red":
      return "rgba(203, 51, 56, "+a+")";
    case "green":
      return "rgba(90, 172, 70, "+a+")";
    case "blue":
      return "rgba(26, 91, 164, "+a+")";
    case "yellow":
      return "rgba(250, 184, 33, "+a+")";
    case "black":
      return "rgba(23, 21, 22, "+a+")";
    case "white":
      return "rgba(241, 239, 242, "+a+")";
    case "unavailable":
      return "rgba(0, 0, 0, "+a+")";
    case "field_user":
      return "rgba(37, 54, 31, "+a+")";
    case "field_computer":
      return "rgba(40, 40, 40, "+a+")";
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class Playcard
{
  constructor(type)
  {
    this.type = type;
  }
  
  static paint_unavailable(x, y)
  {
    ctx.beginPath();
    ctx.rect(x, y, playcard_width, playcard_height);
    ctx.fillStyle = get_rgba("unavailable", unavailable_opacity);
    roundRect(ctx,
      x, y,
      playcard_width, playcard_height,
      playcard_corner_radius, true, false
    );
  }
  
  static create_random(for_stack)
  {
    var red = null;
    var green = null;
    var blue = null;
    var yellow = null;
    if (for_stack) {
      red = "red";
      green = "green";
      blue = "blue";
      yellow = "yellow";
    }
    
    var i = Math.floor(Math.random()*108);
    
    // Red
    if (i < 0+25) {
      if (i < 0+2)
        return new Draw2Card("red");
      if (i < 0+4)
        return new ReverseCard("red");
      if (i < 0+6)
        return new SkipCard("red");
      if (i < 0+7)
        return new NumberCard("red", 0);
      if (i >= 0+7+9)
        i -= 9;
      return new NumberCard("red", (i-(0+7)));
    }
    
    // Green
    if (i < 25+25) {
      if (i < 25+2)
        return new Draw2Card("green");
      if (i < 25+4)
        return new ReverseCard("green");
      if (i < 25+6)
        return new SkipCard("green");
      if (i < 25+7)
        return new NumberCard("green", 0);
      if (i >= 25+7+9)
        i -= 9;
      return new NumberCard("green", (i-(25+7)));
    }
    
    // Blue
    if (i < 50+25) {
      if (i < 50+2)
        return new Draw2Card("blue");
      if (i < 50+4)
        return new ReverseCard("blue");
      if (i < 50+6)
        return new SkipCard("blue");
      if (i < 50+7)
        return new NumberCard("blue", 0);
      if (i >= 50+7+9)
        i -= 9;
      return new NumberCard("blue", (i-(50+7)));
    }
    
    // Yellow
    if (i < 75+25) {
      if (i < 75+2)
        return new Draw2Card("yellow");
      if (i < 75+4)
        return new ReverseCard("yellow");
      if (i < 75+6)
        return new SkipCard("yellow");
      if (i < 75+7)
        return new NumberCard("yellow", 0);
      if (i >= 75+7+9)
        i -= 9;
      return new NumberCard("yellow", (i-(75+7)));
    }
    
    // Wild Cards
    if (i < 101)
      return new WildCard(red);
    if (i < 102)
      return new WildCard(green);
    if (i < 103)
      return new WildCard(blue);
    if (i < 104)
      return new WildCard(yellow);
    if (i < 105)
      return new WildDraw4Card(red);
    if (i < 106)
      return new WildDraw4Card(green);
    if (i < 107)
      return new WildDraw4Card(blue);
    return new WildDraw4Card(yellow);
  }
  
  static paint_base(x, y, color)
  {
    ctx.fillStyle = get_rgba(color, 1);
    roundRect(ctx,
      x, y,
      playcard_width, playcard_height,
      playcard_corner_radius, true, false
    );
  }
  
  static paint_generic(x, y, motive, color, font_px)
  {
    // Border.
    Playcard.paint_base(x, y, "white");
    
    // Color.
    ctx.fillStyle = get_rgba(color, 1);
    roundRect(ctx,
      x+playcard_width_border, y+playcard_width_border,
      playcard_width-2*playcard_width_border, playcard_height-2*playcard_width_border,
      playcard_corner_radius, true, false
    );
    
    // Ellipse.
    ctx.beginPath();
    ctx.ellipse(
      x+playcard_width/2, y+playcard_height/2,
      playcard_width*0.38, playcard_height*0.43,
      0.5, 0, 2*Math.PI
    );
    ctx.strokeStyle = get_rgba("white", 1);
    ctx.lineWidth = playcard_width_border;
    ctx.stroke();
    
    // Motive.
    Playcard.paint_motive(x, y, font_px, motive, "black", "white");
  }
  
  static paint_wild_base(x, y, color)
  {
    // Border.
    Playcard.paint_base(x, y, "black");
    
    // Red
    ctx.fillStyle = get_rgba(color || "red", 1);
    roundRect(ctx,
      x+playcard_width_border, y+playcard_width_border,
      playcard_width/2-playcard_width_border, playcard_height/2-playcard_width_border,
      { tl: playcard_corner_radius, tr: 0, bl: 0, br: 0 }, true, false
    );
    
    // Green
    ctx.fillStyle = get_rgba(color || "green", 1);
    roundRect(ctx,
      x+playcard_width/2, y+playcard_width_border,
      playcard_width/2-playcard_width_border, playcard_height/2-playcard_width_border,
      { tl: 0, tr: playcard_corner_radius, bl: 0, br: 0 }, true, false
    );
    
    // Blue
    ctx.fillStyle = get_rgba(color || "blue", 1);
    roundRect(ctx,
      x+playcard_width_border, y+playcard_height/2,
      playcard_width/2-playcard_width_border, playcard_height/2-playcard_width_border,
      { tl: 0, tr: 0, bl: playcard_corner_radius, br: 0 }, true, false
    );
    
    // Yellow
    ctx.fillStyle = get_rgba(color || "yellow", 1);
    roundRect(ctx,
      x+playcard_width/2, y+playcard_height/2,
      playcard_width/2-playcard_width_border, playcard_height/2-playcard_width_border,
      { tl: 0, tr: 0, bl: 0, br: playcard_corner_radius }, true, false
    );
    
    // Ellipse.
    ctx.beginPath();
    ctx.ellipse(
      x+playcard_width/2, y+playcard_height/2,
      playcard_width*0.38, playcard_height*0.43,
      0.5, 0, 2*Math.PI
    );
    ctx.fillStyle = get_rgba("black", 1);
    ctx.fill();
  }
  
  static paint_motive(x, y, font_px, motive, stroke_color, fill_color)
  {
    var x_divisor = 1.9;
    var y_divisor = 1.85;
    var x_offset = 0.15;
    var y_offset = -0.05;
    var shadow_steps = 10;
    ctx.font = `900 ${font_px}px "Arial Black", "Arial Bold", Gadget, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Shadow.
    ctx.strokeStyle = stroke_color;
    ctx.lineWidth = 2;
    for (var i=1; i<=shadow_steps; i++) {
      ctx.strokeText(
        motive,
        x+playcard_width/(x_divisor+x_offset/i), y+playcard_height/(y_divisor+y_offset/i)
      );
    }
    
    // Fill.
    ctx.fillStyle = fill_color;
    ctx.fillText(
      motive,
      x+playcard_width/x_divisor, y+playcard_height/y_divisor
    );
    
    // Stroke.
    ctx.strokeStyle = stroke_color;
    ctx.lineWidth = 2;
    ctx.strokeText(
      motive,
      x+playcard_width/x_divisor, y+playcard_height/y_divisor
    );
  }
}

class NumberCard extends Playcard
{
  static font_px = playcard_height/2;
  
  constructor(color, number)
  {
    super("NumberCard");
    this.color = color;
    this.number = number;
  }
  
  accepts(card)
  {
    if (card.type == "WildCard" || card.type == "WildDraw4Card")
      return true;
    if (card.type == "SkipCard" || card.type == "ReverseCard" || card.type == "Draw2Card") {
      if (card.color != this.color) {
        if (log_stack)
          console.log(`%c[Stack] Not accepting action card of different color:`, log_stack_style, card);
        return false;
      }
      return true;
    }
    console.assert(card.type == "NumberCard");
    if (card.color == this.color || card.number == this.number)
      return true;
    if (log_stack)
      console.log(`%c[Stack] Not accepting NumberCard:`, log_stack_style, card, this);
    return false;
  }
  
  paint(x, y, opacity)
  {
    Playcard.paint_generic(x, y, this.number.toString(), this.color, NumberCard.font_px);
  }
}

class SkipCard extends Playcard
{
  static font_px = playcard_height/2;
  static score = 20;
  
  constructor(color)
  {
    super("SkipCard");
    this.color = color;
  }
  
  accepts(card)
  {
    if (card.type == "WildCard" || card.type == "WildDraw4Card" || card.type == "SkipCard")
      return true;
    if (card.type == "ReverseCard" || card.type == "Draw2Card") {
      if (card.color != this.color)
        return false;
      return true;
    }
    console.assert(card.type == "NumberCard");
    if (card.color == this.color)
      return true;
    return false;
  }
  
  paint(x, y, opacity)
  {
    Playcard.paint_generic(x, y, "×", this.color, SkipCard.font_px);
  }
}

class ReverseCard extends Playcard
{
  static font_px = playcard_height/2;
  static score = 20;
  
  constructor(color)
  {
    super("ReverseCard");
    this.color = color;
  }
  
  accepts(card)
  {
    if (card.type == "WildCard" || card.type == "WildDraw4Card" || card.type == "ReverseCard")
      return true;
    if (card.type == "SkipCard" || card.type == "Draw2Card") {
      if (card.color != this.color)
        return false;
      return true;
    }
    console.assert(card.type == "NumberCard");
    if (card.color == this.color)
      return true;
    return false;
  }
  
  paint(x, y, opacity)
  {
    Playcard.paint_generic(x, y, "⇄", this.color, ReverseCard.font_px);
  }
}

class Draw2Card extends Playcard
{
  static font_px = playcard_height/3;
  static score = 20;
  
  constructor(color)
  {
    super("Draw2Card");
    this.color = color;
  }
  
  accepts(card)
  {
    if (card.type == "WildCard" || card.type == "WildDraw4Card" || card.type == "Draw2Card")
      return true;
    if (card.type == "SkipCard" || card.type == "ReverseCard") {
      if (card.color != this.color)
        return false;
      return true;
    }
    console.assert(card.type == "NumberCard");
    if (card.color == this.color)
      return true;
    return false;
  }
  
  paint(x, y, opacity)
  {
    Playcard.paint_generic(x, y, "+2", this.color, Draw2Card.font_px);
  }
}

class WildCard extends Playcard
{
  static score = 40;
  
  constructor(color)
  {
    super("WildCard");
    this.color = color;
  }
  
  accepts(card)
  {
    if (card.type == "WildCard" || card.type == "WildDraw4Card")
      return true;
    if (card.color == this.color)
      return true;
    return false;
  }
  
  paint(x, y, opacity)
  {
    Playcard.paint_wild_base(x, y, this.color);
  }
}

class WildDraw4Card extends Playcard
{
  static font_px = playcard_height/2.7;
  static score = 40;
  
  constructor(color)
  {
    super("WildDraw4Card");
    this.color = color;
  }
  
  accepts(card)
  {
    if (card.type == "WildCard" || card.type == "WildDraw4Card")
      return true;
    if (card.color == this.color)
      return true;
    return false;
  }
  
  paint(x, y, opacity)
  {
    Playcard.paint_wild_base(x, y, this.color);
    Playcard.paint_motive(x, y, WildDraw4Card.font_px, "+4", "white", "black");
  }
}

class FaceDownCard
{
  static font_px = playcard_height/5;
  
  static paint(x, y, opacity)
  {
    // Background
    Playcard.paint_base(x, y, "white");
    
    // Inner
    ctx.fillStyle = get_rgba("black", 1);
    roundRect(ctx,
      x+playcard_width_border, y+playcard_width_border,
      playcard_width-2*playcard_width_border, playcard_height-2*playcard_width_border,
      playcard_corner_radius, true, false
    );
    
    // Ellipse.
    ctx.beginPath();
    ctx.ellipse(
      x+playcard_width/2, y+playcard_height/2,
      playcard_width*0.37, playcard_height*0.42,
      0.5, 0, 2*Math.PI
    );
    ctx.fillStyle = get_rgba("red", 1);
    ctx.fill();
    
    // Motive.
    Playcard.paint_motive(x, y, FaceDownCard.font_px, "UNO", "black", "yellow");
  }
}

class Hand
{
  constructor()
  {
    this.cards = [];
    this.may_draw = true;
  }
  
  find_Draw2Card(stack)
  {
    for (var i=0; i<this.cards.length; i++)
      if (this.cards[i].type == "Draw2Card" && stack.accepts(this.cards[i]))
        return i;
    return -1;
  }
  
  find_SkipCard(stack)
  {
    for (var i=0; i<this.cards.length; i++)
      if (this.cards[i].type == "SkipCard" && stack.accepts(this.cards[i]))
        return i;
    return -1;
  }
  
  find_ReverseCard(stack)
  {
    for (var i=0; i<this.cards.length; i++)
      if (this.cards[i].type == "ReverseCard" && stack.accepts(this.cards[i]))
        return i;
    return -1;
  }
  
  find_highest_NumberCard(stack)
  {
    var index_card = -1;
    for (var i=0; i<this.cards.length; i++) {
      if (this.cards[i].type != "NumberCard")
        continue;
      if ((index_card == -1 || this.cards[i].number > this.cards[index_card].number) && stack.accepts(this.cards[i]))
        index_card = i;
    }
    return index_card;
  }
  
  find_WildCard()
  {
    for (var i=0; i<this.cards.length; i++)
      if (this.cards[i].type == "WildCard")
        return i;
    return -1;
  }
  
  find_WildDraw4Card()
  {
    for (var i=0; i<this.cards.length; i++)
      if (this.cards[i].type == "WildDraw4Card")
        return i;
    return -1;
  }
  
  get_color_frequencies()
  {
    var r = 0, g = 0, b = 0, y = 0;
    for (var i=0; i<this.cards.length; i++)
      if (this.cards[i].type != "WildCard" && this.cards[i].type != "WildDraw4Card")
        switch (this.cards[i].color) {
          case "red": r++; break;
          case "green": g++; break;
          case "blue": b++; break;
          case "yellow": y++; break;
        }
    return {
      r: r,
      g: g,
      b: b,
      y: y
    };
  }
  
  find_most_frequent_color()
  {
    var frequencies = this.get_color_frequencies();
    var color = "red";
    var frequency = frequencies.r;
    if (frequencies.g > frequency) {
      color = "green";
      frequency = frequencies.g;
    }
    if (frequencies.b > frequency) {
      color = "blue";
      frequency = frequencies.b;
    }
    if (frequencies.y > frequency) {
      color = "yellow";
      frequency = frequencies.y;
    }
    return color;
  }
  
  add(card)
  {
    this.cards.push(card);
  }

  remove(index_card)
  {
    console.assert(index_card > -1);
    console.assert(index_card < this.cards.length);
    this.cards.splice(index_card, 1);
  }
  
  paint(start_x, start_y, stack, dim_all)
  {
	var reenable_log_stack = false;
	if (log_stack) {
		reenable_log_stack = true;
		log_stack = false;
	}
    var x = start_x;
    var y = start_y;
    var i_line = 0;
    for (var i=0; i<this.cards.length; i++) {
      this.cards[i].paint(x, y, playcard_alpha_available);
      if (!disable_card_dimming && (!stack.accepts(this.cards[i]) || dim_all))
        Playcard.paint_unavailable(x, y);
      x += playcard_width+playcard_separation;
      i_line++;
      if (i_line >= cards_per_row) {
        i_line = 0;
        y += playcard_height+playcard_separation;
        x = start_x;
      }
    }
	if (reenable_log_stack)
		log_stack = true;
  }
  
  paint_facedown(start_x, start_y)
  {
    var x = start_x;
    var y = start_y;
    var i_line = 0;
    for (var i=0; i<this.cards.length; i++) {
      FaceDownCard.paint(x, y, playcard_alpha_available, 1);
      x += playcard_width+playcard_separation;
      i_line++;
      if (i_line >= cards_per_row) {
        i_line = 0;
        y += playcard_height+playcard_separation;
        x = start_x;
      }
    }
  }
  
  calculate_score()
  {
    var score = 0;
    for (var i=0; i<this.cards.length; i++)
      score += this.cards[i].type == "NumberCard" ? this.cards[i].number : Object.getPrototypeOf(this.cards[i]).constructor.score;
    return score;
  }
}

class Stack
{
  constructor()
  {
    this.cards = [];
    this.color = null;
    this.draw_streak = 0;
  }
  
  now()
  {
    console.assert(this.cards.length != 0);
    return this.cards[this.cards.length-1];
  }
  
  accepts(card)
  {
    if (this.draw_streak > 0 && ((card.type != "Draw2Card" && card.type != "WildDraw4Card") || this.now().type == "WildDraw4Card"))
      return false;
    return this.now().accepts(card);
  }
  
  push(card)
  {
    this.cards.push(card);
    if (card.type == "Draw2Card") {
	  if (log_stack)
	    console.log(`%c[Stack] Raising draw streak from ${this.draw_streak} by 2 to ${this.draw_streak+2}.`, log_stack_style);
	  this.draw_streak += 2;
	} else if (card.type == "WildDraw4Card") {
	  if (log_stack)
		console.log(`%c[Stack] Raising draw streak from ${this.draw_streak} by 4 to ${this.draw_streak+4}.`, log_stack_style);
      this.draw_streak += 4;
	}
  }
  
  pop()
  {
    this.cards.pop();
  }
  
  calculate_pseudorandom_paint_offset(index, max_offset)
  {
    var x = index % max_offset;
    var y = max_offset-index%max_offset;
    switch (this.cards[index].type) {
      case "NumberCard":
      case "WildCard":
      case "Draw2Card":
        if (this.cards[index].number > 4)
          x *= -1;
        break;
      default:
        x = 0;
        break;
    }
    switch (this.cards[index].color) {
      case "red":
      case "green":
        y *= -1;
        break;
      case "yellow":
        y = 0;
        break;
    }
    return {
      x: x,
      y: y
    };
  }
  
  paint(x, y, max_offset)
  {
    var nudge = Math.floor(max_offset/2);
    for (var i=0; i<this.cards.length; i++) {
      var offset = this.calculate_pseudorandom_paint_offset(i, max_offset);
      this.cards[i].paint(x+offset.x, y+offset.y, playcard_alpha_available);
    }
  }
  
  _paint_as_sequence(x, y, overlap_percent)
  {
    for (var i=0; i<this.cards.length; i++)
      this.cards[i].paint(x+i*(1-overlap_percent)*playcard_width, y, playcard_alpha_available);
  }
}

class Game
{
  constructor()
  {
    this.users_turn = null;
    this.hand_user = null;
    this.hand_computer = null;
    this.stack = null;
    this.hand_user_y = null;
    this.pass_box = null;
    this.playing = false;
    this.end_of_game_cooldown = false;
  }
  
  reset()
  {
	console.log('%c---------- NEW GAME ----------', 'background-color:black;color:white;font-weight:bold;');
    this.hand_user_y = null;
    this.pass_box = null;
    this.playing = true;
    this.end_of_game_cooldown = false;
    this.hand_user = new Hand();
    this.hand_computer = new Hand();
    for (var i=0; i<starting_card_count; i++) {
      this.hand_user.add(Playcard.create_random());
      this.hand_computer.add(Playcard.create_random());
    }
    this.stack = new Stack();
    this.stack.push(Playcard.create_random(true));
    this.users_turn = Math.random()<0.5; // This result is the opposite of the actual result because apply_card_actions reverses it.
    this.apply_card_actions();
    if (!this.users_turn)
      this.manage(null); // Let computer have first turn.
    this.paint();
  }
  
  _custom_setup()
  {
    this.hand_user_y = null;
    this.pass_box = null;
    this.playing = true;
    this.end_of_game_cooldown = false;
    this.hand_user = new Hand();
    for (var i=0; i<starting_card_count; i++)
      this.hand_user.add(Playcard.create_random());
    this.hand_computer = new Hand();
    for (var i=0; i<starting_card_count; i++)
      this.hand_computer.add(Playcard.create_random());
    this.stack = new Stack();
    
    // Custom User Hand.
    this.hand_user = new Hand();
    this.hand_user.add(new WildDraw4Card(null));
    this.hand_user.add(new NumberCard("blue", 9));
    this.hand_user.add(new NumberCard("blue", 9));
    
    // Custom Computer Hand.
    this.hand_computer = new Hand();
    this.hand_computer.add(new NumberCard("green", 8));
    this.hand_computer.add(new WildDraw4Card(null));
    
    // Custom Stack.
    this.stack = new Stack();
    this.stack.push(new NumberCard("blue", 9));
    
    this.users_turn = !false; // Use opposite because apply_card_actions reverses it.
    this.apply_card_actions();
    if (!this.users_turn)
      this.manage(null); // Let computer have first turn.
    this.paint();
  }
  
  apply_card_actions()
  {
    switch (this.stack.now().type) {
      case "SkipCard":
      case "ReverseCard":
        break;
      default:
        this.users_turn = !this.users_turn;
        break;
    }
  }
  
  play_card(hand_player, index_card)
  {
    console.assert(index_card < hand_player.cards.length);
    console.assert(this.stack.accepts(hand_player.cards[index_card]));
    this.stack.push(hand_player.cards[index_card]);
    hand_player.remove(index_card);
    this.apply_card_actions();
  }
  
  draw_cards(hand_user, amount)
  {
    for (var i=0; i<amount; i++)
      hand_user.add(Playcard.create_random());
  }
  
  lose_draw_streak(hand_user)
  {
	if (log_stack)
		console.log(`%c[Stack] Draw streak reset.`, log_stack_style);
    this.draw_cards(hand_user, this.stack.draw_streak);
    this.stack.draw_streak = 0;
  }
  
  /*
  *** Strategies
  */
  
  /*
  If the user only has one card left, try to make them draw cards.
  */
  computer_avoid_defeat()
  {
    if (this.hand_user.cards.length > 1)
      return -1;
    var index_card = this.hand_computer.find_WildDraw4Card();
    if (index_card != -1) {
      if (log_strategizing)
        console.log(`%c[Computer] Avoiding defeat using WildDraw4Card at [${index_card}]:`, log_strategizing_style, this.hand_computer.cards[index_card]);
      this.hand_computer.cards[index_card].color = this.hand_computer.find_most_frequent_color();
      return index_card;
    }
    index_card = this.hand_computer.find_Draw2Card(this.stack);
    if (index_card != -1) {
      if (log_strategizing)
        console.log(`%c[Computer] Avoiding defeat using Draw2Card at [${index_card}]:`, log_strategizing_style, this.hand_computer.cards[index_card]);
      return index_card;
    }
    return -1;
  }
  
  /*
  Reflect Draw2Cards if needed and possible.
  */
  computer_reflect_Draw2Card()
  {
    if (this.stack.now().type != "Draw2Card" || this.stack.draw_streak == 0)
      return -1;
    var index_card = this.hand_computer.find_Draw2Card(this.stack);
    if (index_card != -1) {
      if (log_strategizing)
        console.log(`%c[Computer] Reflecting Draw2Card using Draw2Card at [${index_card}]:`, log_strategizing_style, this.hand_computer.cards[index_card]);
      return index_card;
    }
    index_card = this.hand_computer.find_WildDraw4Card();
    if (index_card != -1) {
      if (log_strategizing)
        console.log(`%c[Computer] Reflecting Draw2Card using WildDraw4Card at [${index_card}]:`, log_strategizing_style, this.hand_computer.cards[index_card]);
      this.hand_computer.cards[index_card].color = this.hand_computer.find_most_frequent_color();
      return index_card;
    }
    return -1;
  }
  
  /*
  Attempt to play multiple cards at once.
  */
  computer_maximize_cards_played()
  {
    // TODO:
    return -1;
  }
  
  /*
  Determine if it makes sense to violate some lower-priority strategies to promote color diversity.
  */
  computer_promote_color_diversity()
  {
    // TODO:
    return -1;
  }
  
  /*
  Shed action cards before others.
  */
  computer_shed_action_card()
  {
    var index_card = this.hand_computer.find_SkipCard(this.stack);
    if (index_card != -1) {
      if (log_strategizing)
        console.log(`%c[Computer] Shedding SkipCard at [${index_card}]:`, log_strategizing_style, this.hand_computer.cards[index_card]);
      return index_card;
    }
    index_card = this.hand_computer.find_ReverseCard(this.stack);
    if (index_card != -1) {
      if (log_strategizing)
        console.log(`%c[Computer] Shedding ReverseCard at [${index_card}]:`, log_strategizing_style, this.hand_computer.cards[index_card]);
      return index_card;
    }
    return -1;
  }
  
  /*
  Shed high numbers first.
  */
  computer_shed_highest_number()
  {
    var index_card = this.hand_computer.find_highest_NumberCard(this.stack);
    if (index_card != -1) {
      if (log_strategizing)
        console.log(`%c[Computer] Shedding NumberCard at [${index_card}]:`, log_strategizing_style, this.hand_computer.cards[index_card]);
      return index_card;
    }
    return -1;
  }
  
  /*
  Change color.
  */
  computer_change_color()
  {
    var index_card = this.hand_computer.find_WildCard();
    if (index_card == -1)
      return -1;
    if (log_strategizing)
      console.log(`%c[Computer] Using WildCard at [${index_card}];`, log_strategizing_style, this.hand_computer.cards[index_card]);
    // Choose the color of which we have the most cards.
    this.hand_computer.cards[index_card].color = this.hand_computer.find_most_frequent_color();
    if (log_strategizing)
      console.log(`%c[Computer] Changing color to ${this.hand_computer.cards[index_card].color}.`, log_strategizing_style);
    return index_card;
  }
  
  /*
  Play WildDraw4Card.
  */
  computer_play_wild_draw()
  {
    var index_card = this.hand_computer.find_WildDraw4Card();
    if (index_card == -1)
      return -1;
    if (log_strategizing)
      console.log(`%c[Computer] Playing WildDraw4Card at [${index_card}];`, log_strategizing_style, this.hand_computer.cards[index_card]);
    // Choose the color of which we have the most cards.
    this.hand_computer.cards[index_card].color = this.hand_computer.find_most_frequent_color();
    if (log_strategizing)
      console.log(`%c[Computer] Changing color to ${this.hand_computer.cards[index_card].color}.`, log_strategizing_style);
    return index_card;
  }
  
  /*
  Begin draw streak.
  */
  computer_begin_draw_streak()
  {
    var index_card = this.hand_computer.find_Draw2Card(this.stack);
    if (index_card != -1) {
      if (log_strategizing)
        console.log(`%c[Computer] Beginning draw streak using Draw2Card at [${index_card}]:`, log_strategizing_style, this.hand_computer.cards[index_card]);
      return index_card;
    }
    return -1;
  }
  
  manage(event)
  {
    if (this.end_of_game_cooldown)
      return;
    if (!this.playing) {
      this.reset();
      return;
    }
    
    /*
    User action.
    */
    if (this.users_turn) {
      // Prevent further events from interfering.
      this.users_turn = false;
      // Process event.
      var response = this.process_click_event(event);
      // Carry out action.
      switch (response) {
        // Invalid clicks.
        case USER_ACTION_INVALID:
          this.users_turn = true;
          return;
        // Draw from reserve pile.
        case USER_ACTION_DRAW:
          if (this.stack.draw_streak > 0)
            this.lose_draw_streak(this.hand_user);
          else if (this.hand_user.may_draw)
            this.draw_cards(this.hand_user, 1);
          this.users_turn = true;
          this.hand_user.may_draw = false;
          break;
        // Refuse to play card.
        case USER_ACTION_PASS:
          if (this.hand_user.may_draw || this.stack.draw_streak > 0) {
            this.users_turn = true;
            return;
          }
          this.hand_user.may_draw = true;
          break;
        // Play card.
        default:
          if (!this.stack.accepts(this.hand_user.cards[response.i])) {
            this.users_turn = true;
            return;
          }
          if (this.hand_user.cards[response.i].type == "WildCard" || this.hand_user.cards[response.i].type == "WildDraw4Card")
            this.hand_user.cards[response.i].color = response.c;
          this.users_turn = true;
          this.play_card(this.hand_user, response.i); // Unless the card is SkipCard or ReverseCard, this call passes the turn to the next player.
          this.hand_user.may_draw = true;
          break;
      }
      // Update field.
      this.paint();
    }

    // Check if player has won.
    if (this.hand_user.cards.length == 0) {
      this.playing = false;
      this.end_of_game_cooldown = true;
      sleep(computer_delay_ms)
        .then(() => {
          this.paint_won();
          this.end_of_game_cooldown = false;
        });
      return;
    }
    
    /*
    Computer reaction.
    */
    if (this.hand_user.cards.length > 0 && !this.users_turn)
      sleep(computer_delay_ms)
        .then(() => {
          this.computer_react(this);
          this.paint();
          if (!this.users_turn && this.hand_computer.cards.length > 0)
            this.manage(null);
          if (this.hand_computer.cards.length == 0) {
            this.playing = false;
            this.end_of_game_cooldown = true;
            sleep(computer_delay_ms)
              .then(() => {
                this.paint_lost();
                this.end_of_game_cooldown = false;
              });
          }
        }); 
  }
  
  computer_react()
  {
    // Reflect Draw2Card.
    var index_card = this.computer_reflect_Draw2Card();
    if (index_card != -1) {
      this.play_card(this.hand_computer, index_card);
      this.hand_computer.may_draw = true;
      return;
    }
    
    // Otherwise, quit draw streak.
    if (this.stack.draw_streak > 0) {
      this.lose_draw_streak(this.hand_computer);
      this.hand_computer.may_draw = false;
      return;
    }
    
    // Determine most optimal card and play it.
    index_card = this.computer_avoid_defeat();
    if (index_card == -1)
      index_card = this.computer_maximize_cards_played();
    if (index_card == -1)
      index_card = this.computer_promote_color_diversity();
    if (index_card == -1)
      index_card = this.computer_shed_action_card();
    if (index_card == -1)
      index_card = this.computer_shed_highest_number();
    if (index_card == -1)
      index_card = this.computer_change_color();
    if (index_card == -1)
      index_card = this.computer_play_wild_draw();
    if (index_card == -1)
      index_card = this.computer_begin_draw_streak();
    if (index_card != -1) {
      this.play_card(this.hand_computer, index_card);
      this.hand_computer.may_draw = true;
      return;
    }
    
    // If stuck, draw a card if allowed, else pass.
    if (this.hand_computer.may_draw) {
      if (log_strategizing)
        console.log(`%c[Computer] Drawing card.`, log_strategizing_style)
      this.draw_cards(this.hand_computer, 1);
      this.hand_computer.may_draw = false;
    } else {
      if (log_strategizing)
        console.log(`%c[Computer] Passing.`, log_strategizing_style)
      this.hand_computer.may_draw = true;
      this.users_turn = !this.users_turn;
    }
  }
  
  process_click_event(event)
  {
    console.assert(this.hand_user_y != null);
    
    // Convert to client coordinates.
    var rect = canvas.getBoundingClientRect();
    var x = Math.round(event.clientX-rect.left);
    var y = Math.round(event.clientY-rect.top);
    
    // Check if click is on reserve pile.
    var reserve_pile_y = (canvas_height-playcard_height)/2;
    if (x >= border_padding && x < border_padding+playcard_width && y >= reserve_pile_y && y < reserve_pile_y+playcard_height)
      return USER_ACTION_DRAW;
    
    // Check if click on "Pass" button.
    if (this.pass_box != null && (x >= this.pass_box.x && x < this.pass_box.x+this.pass_box.w && y >= this.pass_box.y && y < this.pass_box.y+this.pass_box.h))
      return USER_ACTION_PASS;
    
    // Check if click is within hand region.
    if (y < this.hand_user_y)
      return USER_ACTION_INVALID;
    
    // Compute theoretical position.
    var column = Math.floor((x-border_padding)/(playcard_width+playcard_separation));
    var row = Math.floor((y-this.hand_user_y)/(playcard_height+playcard_separation));
    
    // Ensure click is not between cards.
    var min_x = border_padding+column*(playcard_width+playcard_separation);
    var min_y = this.hand_user_y+row*(playcard_height+playcard_separation);
    if (x < min_x || x > min_x+playcard_width || y < min_y || y > min_y+playcard_height)
      return USER_ACTION_INVALID;
    
    // Compute card index.
    var index_card = row*cards_per_row+column;
    
    // Ensure card index is within bounds.
    if (index_card >= this.hand_user.cards.length)
      return USER_ACTION_INVALID;
    
    // Compute color.
    var x_offset = x-min_x;
    var y_offset = y-min_y;
    var color;
    if (x_offset > playcard_width/2) {
      if (y_offset > playcard_height/2) {
        color = "yellow";
      } else {
        color = "green";
      }
    } else {
      if (y_offset > playcard_height/2) {
        color = "blue";
      } else {
        color = "red";
      }
    }
    
    return {
      i: index_card,
      c: color
    };
  }
  
  paint()
  {
    // Paint Canvas
    ctx.beginPath();
    ctx.rect(0, 0, canvas_width, canvas_height);
    if (this.users_turn)
      ctx.fillStyle = get_rgba("field_user", 1);
    else
      ctx.fillStyle = get_rgba("field_computer", 1);
    ctx.fill();
    
    // Paint Hands
    var rows = Math.ceil(this.hand_user.cards.length/cards_per_row);
    this.hand_user_y = canvas_height+playcard_separation-border_padding-rows*(playcard_height+playcard_separation);
    this.hand_user.paint(border_padding, this.hand_user_y, this.stack, !this.users_turn);
    if (reveal_computer_hand)
      this.hand_computer.paint(border_padding, border_padding, this.stack);
    else
      this.hand_computer.paint_facedown(border_padding, border_padding);
    
    // Paint Stack
    if (paint_stack_as_sequence)
      this.stack._paint_as_sequence(border_padding+2*playcard_width, (canvas_height-playcard_height)/2, 0.5)
    else
      this.stack.paint((canvas_width-playcard_width)/2, (canvas_height-playcard_height)/2, 10);
    
    // Paint Reserve Pile
    FaceDownCard.paint(border_padding, (canvas_height-playcard_height)/2, 1);
    if (!this.hand_user.may_draw || !this.users_turn)
      Playcard.paint_unavailable(border_padding, (canvas_height-playcard_height)/2);
    
    // Paint "Pass" button.
    var text_height = playcard_width/2;
    var padding = 20;
    ctx.font = `bold ${text_height}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var text = "Pass";
    var text_width = ctx.measureText(text).width;
    this.pass_box = {
      x: canvas_width-border_padding-text_width-padding,
      y: (canvas_height-text_height-padding)/2,
      w: text_width+padding,
      h: text_height+padding
    };
    ctx.fillStyle = get_rgba("white", 1);
    roundRect(ctx,
      this.pass_box.x, this.pass_box.y,
      this.pass_box.w, this.pass_box.h,
      playcard_corner_radius, true, false
    );
    ctx.fillStyle = get_rgba("black", 1);
    roundRect(ctx,
      this.pass_box.x+playcard_width_border, this.pass_box.y+playcard_width_border,
      this.pass_box.w-2*playcard_width_border, this.pass_box.h-2*playcard_width_border,
      playcard_corner_radius, true, false
    );
    ctx.beginPath();
    ctx.fillStyle = get_rgba("white", 1);
    ctx.fillText(
      text,
      canvas_width-border_padding-(text_width+padding)/2,
      canvas_height/2
    );
    if (!this.users_turn || this.stack.draw_streak > 0 || this.hand_user.may_draw) {
      ctx.fillStyle = get_rgba("unavailable", unavailable_opacity);
      roundRect(ctx,
        this.pass_box.x, this.pass_box.y,
        this.pass_box.w, this.pass_box.h,
        playcard_corner_radius, true, false
      );
    }
    
    // Paint Draw Streak.
    if (this.hand_user.may_draw && this.users_turn)
      Playcard.paint_motive(border_padding+playcard_width, canvas_height/2-playcard_height/2, playcard_height/4, `+${this.stack.draw_streak || 1}`, "black", "white");
  }
  
  paint_won()
  {
    // Paint Canvas
    ctx.beginPath();
    ctx.rect(0, 0, canvas_width, canvas_height);
    ctx.fillStyle = get_rgba("field_user", 1);
    ctx.fill();
    
    // Paint message.
    Playcard.paint_motive((canvas_width-playcard_width)/2, (canvas_height-playcard_height)/2.5, canvas_height*0.1, "You won!", "black", "green");
    Playcard.paint_motive((canvas_width-playcard_width)/2, (canvas_height-playcard_height)/2, canvas_height*0.05, `Click anywhere to play again`, "black", "white");
  }
  
  paint_lost()
  {
    // Paint Canvas
    ctx.beginPath();
    ctx.rect(0, 0, canvas_width, canvas_height);
    ctx.fillStyle = get_rgba("field_computer", 1);
    ctx.fill();
    
    // Calculate score.
    // var score = this.hand_user.calculate_score();
    
    // Retrieve overall score.
    var overall = 10298102912;
    
    // Paint message.
    Playcard.paint_motive((canvas_width-playcard_width)/2, (canvas_height-playcard_height)/2.5, canvas_height*0.1, "You lost.", "black", "red");
    Playcard.paint_motive((canvas_width-playcard_width)/2, (canvas_height-playcard_height)/2, canvas_height*0.05, `Click anywhere to play again`, "black", "white");
    // Playcard.paint_motive((canvas_width-playcard_width)/2, (canvas_height-playcard_height)/2, canvas_height*0.05, `Score: ${score}`, "black", "white");
    // Playcard.paint_motive((canvas_width-playcard_width)/2, (canvas_height-playcard_height)/1.75, canvas_height*0.04, `Overall Score: ${overall}`, "black", "white");
  }
}

// Setup
var canvas = document.getElementById("board");
var ctx = canvas.getContext("2d");

var game = new Game();
if (use_custom_setup)
  game._custom_setup();
else
  game.reset();
game.paint();

function handle_click_event(event)
{
  game.manage(event);
}

canvas.addEventListener("click", handle_click_event);

// User options.

class Options
{
	get list()
	{
		console.log(
			"%cOptions%c\n\n" +
			"s.dim: Dim unplayable cards.\n" +
			"s.delay=ms: Delay between moves in milliseconds.\n" +
			"\n%cCheats%c\n\n" +
			"s.peek: Reveal computer hand.\n" +
			"s.log_strat: Log computer decisions.\n" +
			"s.log_stack: Log stack logic.\n" +
			"\n%cOther%c\n\n" +
			"s.reset: Restart game.\n" +
			"s.list: Show this list.\n" +
			"\n%cExamples\n\n" +
			"%c> %cs.dim; %c// Toggles dimming of unplayable cards.\n" +
			"%c> %cs.delay=100; %c// Sets delay to 100 milliseconds.\n",
			"font-weight:bold;",
			"",
			"font-weight:bold;",
			"",
			"font-weight:bold;",
			"",
			"font-weight:bold;color:gray;",
			"font-weight:bold;color:#367CF1;",
			"color:gray;",
			"color:gray;font-style:italic;",
			"font-weight:bold;color:#367CF1;",
			"color:gray;",
			"color:gray;font-style:italic;"
		);
	}
	
	get dim()
	{
		disable_card_dimming = !disable_card_dimming;
		game.paint();
	}
	
	get peek()
	{
		reveal_computer_hand = !reveal_computer_hand;
		game.paint();
	}
  
  set delay(ms)
  {
    computer_delay_ms = ms;
  }
  
  get log_strat()
  {
    log_strategizing = !log_strategizing;
  }
  
  get log_stack()
  {
    log_stack = !log_stack;
  }
  
  get reset()
  {
	  game.reset();
  }
}

var s = new Options();
