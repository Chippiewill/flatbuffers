// automatically generated, do not modify

namespace NamespaceA
{

using System;
using FlatBuffers;

public sealed class SecondTableInA : Table {
  public static SecondTableInA GetRootAsSecondTableInA(ByteBuffer _bb) { return GetRootAsSecondTableInA(_bb, new SecondTableInA()); }
  public static SecondTableInA GetRootAsSecondTableInA(ByteBuffer _bb, SecondTableInA obj) { return (obj.__init(_bb.GetInt(_bb.Position) + _bb.Position, _bb)); }
  public SecondTableInA __init(int _i, ByteBuffer _bb) { bb_pos = _i; bb = _bb; return this; }

  public NamespaceC.TableInC ReferToC { get { return GetReferToC(new NamespaceC.TableInC()); } }
  public NamespaceC.TableInC GetReferToC(NamespaceC.TableInC obj) { int o = __offset(4); return o != 0 ? obj.__init(__indirect(o + bb_pos), bb) : null; }

  public static Offset<SecondTableInA> CreateSecondTableInA(FlatBufferBuilder builder,
      Offset<NamespaceC.TableInC> refer_to_cOffset = default(Offset<NamespaceC.TableInC>)) {
    builder.StartObject(1);
    SecondTableInA.AddReferToC(builder, refer_to_cOffset);
    return SecondTableInA.EndSecondTableInA(builder);
  }

  public static void StartSecondTableInA(FlatBufferBuilder builder) { builder.StartObject(1); }
  public static void AddReferToC(FlatBufferBuilder builder, Offset<NamespaceC.TableInC> referToCOffset) { builder.AddOffset(0, referToCOffset.Value, 0); }
  public static Offset<SecondTableInA> EndSecondTableInA(FlatBufferBuilder builder) {
    int o = builder.EndObject();
    return new Offset<SecondTableInA>(o);
  }
};


}
