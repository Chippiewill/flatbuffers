// Run this using JavaScriptTest.sh
var assert = require('assert');
var fs = require('fs');

var flatbuffers = require('../js/flatbuffers').flatbuffers;
var MyGame = require('./monster_test_generated').MyGame;

function main() {

  // First, let's test reading a FlatBuffer generated by C++ code:
  // This file was generated from monsterdata_test.json
  var data = new Uint8Array(fs.readFileSync('monsterdata_test.mon'));

  // Now test it:

  var bb = new flatbuffers.ByteBuffer(data);
  testBuffer(bb);

  // Second, let's create a FlatBuffer from scratch in JavaScript, and test it also.
  // We use an initial size of 1 to exercise the reallocation algorithm,
  // normally a size larger than the typical FlatBuffer you generate would be
  // better for performance.
  var fbb = new flatbuffers.Builder(1);

  // We set up the same values as monsterdata.json:

  var str = fbb.createString('MyMonster');

  var inv = MyGame.Example.Monster.createInventoryVector(fbb, [0, 1, 2, 3, 4]);

  var fred = fbb.createString('Fred');
  MyGame.Example.Monster.startMonster(fbb);
  MyGame.Example.Monster.addName(fbb, fred);
  var mon2 = MyGame.Example.Monster.endMonster(fbb);

  MyGame.Example.Monster.startTest4Vector(fbb, 2);
  MyGame.Example.Test.createTest(fbb, 10, 20);
  MyGame.Example.Test.createTest(fbb, 30, 40);
  var test4 = fbb.endVector();

  var testArrayOfString = MyGame.Example.Monster.createTestarrayofstringVector(fbb, [
    fbb.createString('test1'),
    fbb.createString('test2')
  ]);

  MyGame.Example.Monster.startMonster(fbb);
  MyGame.Example.Monster.addPos(fbb, MyGame.Example.Vec3.createVec3(fbb, 1, 2, 3, 3, MyGame.Example.Color.Green, 5, 6));
  MyGame.Example.Monster.addHp(fbb, 80);
  MyGame.Example.Monster.addName(fbb, str);
  MyGame.Example.Monster.addInventory(fbb, inv);
  MyGame.Example.Monster.addTestType(fbb, MyGame.Example.Any.Monster);
  MyGame.Example.Monster.addTest(fbb, mon2);
  MyGame.Example.Monster.addTest4(fbb, test4);
  MyGame.Example.Monster.addTestarrayofstring(fbb, testArrayOfString);
  MyGame.Example.Monster.addTestbool(fbb, false);
  var mon = MyGame.Example.Monster.endMonster(fbb);

  MyGame.Example.Monster.finishMonsterBuffer(fbb, mon);

  // Write the result to a file for debugging purposes:
  // Note that the binaries are not necessarily identical, since the JSON
  // parser may serialize in a slightly different order than the above
  // JavaScript code. They are functionally equivalent though.

  fs.writeFileSync('monsterdata_javascript_wire.mon', new Buffer(fbb.asUint8Array()));

  // Test it:
  testBuffer(fbb.dataBuffer());

  test64bit();
  testUnicode();
  fuzzTest1();

  console.log('FlatBuffers test: completed successfully');
}

function testBuffer(bb) {
  assert.ok(MyGame.Example.Monster.bufferHasIdentifier(bb));

  var monster = MyGame.Example.Monster.getRootAsMonster(bb);

  assert.strictEqual(monster.hp(), 80);
  assert.strictEqual(monster.mana(), 150); // default

  assert.strictEqual(monster.name(), 'MyMonster');

  var pos = monster.pos();
  assert.strictEqual(pos.x(), 1);
  assert.strictEqual(pos.y(), 2);
  assert.strictEqual(pos.z(), 3);
  assert.strictEqual(pos.test1(), 3);
  assert.strictEqual(pos.test2(), MyGame.Example.Color.Green);
  var t = pos.test3();
  assert.strictEqual(t.a(), 5);
  assert.strictEqual(t.b(), 6);

  assert.strictEqual(monster.testType(), MyGame.Example.Any.Monster);
  var monster2 = new MyGame.Example.Monster();
  assert.strictEqual(monster.test(monster2) != null, true);
  assert.strictEqual(monster2.name(), 'Fred');

  assert.strictEqual(monster.inventoryLength(), 5);
  var invsum = 0;
  for (var i = 0; i < monster.inventoryLength(); i++) {
    invsum += monster.inventory(i);
  }
  assert.strictEqual(invsum, 10);

  var test_0 = monster.test4(0);
  var test_1 = monster.test4(1);
  assert.strictEqual(monster.test4Length(), 2);
  assert.strictEqual(test_0.a() + test_0.b() + test_1.a() + test_1.b(), 100);

  assert.strictEqual(monster.testarrayofstringLength(), 2);
  assert.strictEqual(monster.testarrayofstring(0), 'test1');
  assert.strictEqual(monster.testarrayofstring(1), 'test2');

  assert.strictEqual(monster.testbool(), false);
}

function test64bit() {
  var fbb = new flatbuffers.Builder();
  var required = fbb.createString('required');

  MyGame.Example.Stat.startStat(fbb);
  var stat2 = MyGame.Example.Stat.endStat(fbb);

  MyGame.Example.Monster.startMonster(fbb);
  MyGame.Example.Monster.addName(fbb, required);
  MyGame.Example.Monster.addTestempty(fbb, stat2);
  var mon2 = MyGame.Example.Monster.endMonster(fbb);

  MyGame.Example.Stat.startStat(fbb);
  MyGame.Example.Stat.addVal(fbb, new flatbuffers.Long(0x12345678, 0x23456789));
  var stat = MyGame.Example.Stat.endStat(fbb);

  MyGame.Example.Monster.startMonster(fbb);
  MyGame.Example.Monster.addName(fbb, required);
  MyGame.Example.Monster.addEnemy(fbb, mon2);
  MyGame.Example.Monster.addTestempty(fbb, stat);
  var mon = MyGame.Example.Monster.endMonster(fbb);

  MyGame.Example.Monster.finishMonsterBuffer(fbb, mon);
  var bytes = fbb.asUint8Array();

  ////////////////////////////////////////////////////////////////

  var bb = new flatbuffers.ByteBuffer(bytes);
  assert.ok(MyGame.Example.Monster.bufferHasIdentifier(bb));
  var mon = MyGame.Example.Monster.getRootAsMonster(bb);

  var stat = mon.testempty();
  assert.strictEqual(stat != null, true);
  assert.strictEqual(stat.val() != null, true);
  assert.strictEqual(stat.val().low, 0x12345678);
  assert.strictEqual(stat.val().high, 0x23456789);

  var mon2 = mon.enemy();
  assert.strictEqual(mon2 != null, true);
  stat = mon2.testempty();
  assert.strictEqual(stat != null, true);
  assert.strictEqual(stat.val() != null, true);
  assert.strictEqual(stat.val().low, 0); // default value
  assert.strictEqual(stat.val().high, 0);
}

function testUnicode() {
  var correct = fs.readFileSync('unicode_test.mon');
  var json = JSON.parse(fs.readFileSync('unicode_test.json', 'utf8'));

  // Test reading
  var bb = new flatbuffers.ByteBuffer(new Uint8Array(correct));
  var monster = MyGame.Example.Monster.getRootAsMonster(bb);
  assert.strictEqual(monster.name(), json.name);
  assert.deepEqual(new Buffer(monster.name(flatbuffers.Encoding.UTF8_BYTES)), new Buffer(json.name));
  assert.strictEqual(monster.testarrayoftablesLength(), json.testarrayoftables.length);
  json.testarrayoftables.forEach(function(table, i) {
    var value = monster.testarrayoftables(i);
    assert.strictEqual(value.name(), table.name);
    assert.deepEqual(new Buffer(value.name(flatbuffers.Encoding.UTF8_BYTES)), new Buffer(table.name));
  });
  assert.strictEqual(monster.testarrayofstringLength(), json.testarrayofstring.length);
  json.testarrayofstring.forEach(function(string, i) {
    assert.strictEqual(monster.testarrayofstring(i), string);
    assert.deepEqual(new Buffer(monster.testarrayofstring(i, flatbuffers.Encoding.UTF8_BYTES)), new Buffer(string));
  });

  // Test writing
  var fbb = new flatbuffers.Builder();
  var name = fbb.createString(json.name);
  var testarrayoftablesOffsets = json.testarrayoftables.map(function(table) {
    var name = fbb.createString(new Uint8Array(new Buffer(table.name)));
    MyGame.Example.Monster.startMonster(fbb);
    MyGame.Example.Monster.addName(fbb, name);
    return MyGame.Example.Monster.endMonster(fbb);
  });
  var testarrayoftablesOffset = MyGame.Example.Monster.createTestarrayoftablesVector(fbb,
    testarrayoftablesOffsets);
  var testarrayofstringOffset = MyGame.Example.Monster.createTestarrayofstringVector(fbb,
    json.testarrayofstring.map(function(string) { return fbb.createString(string); }));
  MyGame.Example.Monster.startMonster(fbb);
  MyGame.Example.Monster.addTestarrayofstring(fbb, testarrayofstringOffset);
  MyGame.Example.Monster.addTestarrayoftables(fbb, testarrayoftablesOffset);
  MyGame.Example.Monster.addName(fbb, name);
  MyGame.Example.Monster.finishMonsterBuffer(fbb, MyGame.Example.Monster.endMonster(fbb));
  assert.deepEqual(new Buffer(fbb.asUint8Array()), correct);
}

var __imul = Math.imul ? Math.imul : function(a, b) {
  var ah = a >> 16 & 65535;
  var bh = b >> 16 & 65535;
  var al = a & 65535;
  var bl = b & 65535;
  return al * bl + (ah * bl + al * bh << 16) | 0;
};

// Include simple random number generator to ensure results will be the
// same cross platform.
// http://en.wikipedia.org/wiki/Park%E2%80%93Miller_random_number_generator
var lcg_seed = 48271;

function lcg_rand() {
  return lcg_seed = (__imul(lcg_seed, 279470273) >>> 0) % 4294967291;
}

function lcg_reset() {
  lcg_seed = 48271;
}

// Converts a Field ID to a virtual table offset.
function fieldIndexToOffset(field_id) {
  // Should correspond to what EndTable() below builds up.
  var fixed_fields = 2;  // Vtable size and Object Size.
  return (field_id + fixed_fields) * 2;
}

// Low level stress/fuzz test: serialize/deserialize a variety of
// different kinds of data in different combinations
function fuzzTest1() {

  // Values we're testing against: chosen to ensure no bits get chopped
  // off anywhere, and also be different from eachother.
  var bool_val   = true;
  var char_val   = -127;  // 0x81
  var uchar_val  = 0xFF;
  var short_val  = -32222; // 0x8222;
  var ushort_val = 0xFEEE;
  var int_val    = 0x83333333 | 0;
  var uint_val   = 0xFDDDDDDD;
  var long_val   = new flatbuffers.Long(0x44444444, 0x84444444);
  var ulong_val  = new flatbuffers.Long(0xCCCCCCCC, 0xFCCCCCCC);
  var float_val  = new Float32Array([3.14159])[0];
  var double_val = 3.14159265359;

  var test_values_max = 11;
  var fields_per_object = 4;
  var num_fuzz_objects = 10000;  // The higher, the more thorough :)

  var builder = new flatbuffers.Builder();

  lcg_reset();  // Keep it deterministic.

  var objects = [];

  // Generate num_fuzz_objects random objects each consisting of
  // fields_per_object fields, each of a random type.
  for (var i = 0; i < num_fuzz_objects; i++) {
    builder.startObject(fields_per_object);
    for (var f = 0; f < fields_per_object; f++) {
      var choice = lcg_rand() % test_values_max;
      switch (choice) {
        case 0:  builder.addFieldInt8(f, bool_val,   0); break;
        case 1:  builder.addFieldInt8(f, char_val,   0); break;
        case 2:  builder.addFieldInt8(f, uchar_val,  0); break;
        case 3:  builder.addFieldInt16(f, short_val,  0); break;
        case 4:  builder.addFieldInt16(f, ushort_val, 0); break;
        case 5:  builder.addFieldInt32(f, int_val,    0); break;
        case 6:  builder.addFieldInt32(f, uint_val,   0); break;
        case 7:  builder.addFieldInt64(f, long_val,   flatbuffers.Long.ZERO); break;
        case 8:  builder.addFieldInt64(f, ulong_val,  flatbuffers.Long.ZERO); break;
        case 9:  builder.addFieldFloat32(f, float_val,  0); break;
        case 10: builder.addFieldFloat64(f, double_val, 0); break;
      }
    }
    objects.push(builder.endObject());
  }
  builder.prep(8, 0);  // Align whole buffer.

  lcg_reset();  // Reset.

  builder.finish(objects[objects.length - 1]);
  var bytes = new Uint8Array(builder.asUint8Array());
  var view = new DataView(bytes.buffer);

  // Test that all objects we generated are readable and return the
  // expected values. We generate random objects in the same order
  // so this is deterministic.
  for (var i = 0; i < num_fuzz_objects; i++) {
    var offset = bytes.length - objects[i];
    for (var f = 0; f < fields_per_object; f++) {
      var choice = lcg_rand() % test_values_max;
      var vtable_offset = fieldIndexToOffset(f);
      var vtable = offset - view.getInt32(offset, true);
      assert.ok(vtable_offset < view.getInt16(vtable, true));
      var field_offset = offset + view.getInt16(vtable + vtable_offset, true);
      switch (choice) {
        case 0:  assert.strictEqual(!!view.getInt8(field_offset), bool_val); break;
        case 1:  assert.strictEqual(view.getInt8(field_offset), char_val); break;
        case 2:  assert.strictEqual(view.getUint8(field_offset), uchar_val); break;
        case 3:  assert.strictEqual(view.getInt16(field_offset, true), short_val); break;
        case 4:  assert.strictEqual(view.getUint16(field_offset, true), ushort_val); break;
        case 5:  assert.strictEqual(view.getInt32(field_offset, true), int_val); break;
        case 6:  assert.strictEqual(view.getUint32(field_offset, true), uint_val); break;
        case 7:  assert.strictEqual(view.getInt32(field_offset, true), long_val.low); assert.strictEqual(view.getInt32(field_offset + 4, true), long_val.high); break;
        case 8:  assert.strictEqual(view.getInt32(field_offset, true), ulong_val.low); assert.strictEqual(view.getInt32(field_offset + 4, true), ulong_val.high); break;
        case 9:  assert.strictEqual(view.getFloat32(field_offset, true), float_val); break;
        case 10: assert.strictEqual(view.getFloat64(field_offset, true), double_val); break;
      }
    }
  }
}

main();
