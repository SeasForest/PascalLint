{*
  Auto-Fix Test Cases (Before)
  ============================
  Contains issues that can be auto-fixed.
  Compare with after/fixable.pas after running --fix.
*}

unit FixableIssues;

interface

implementation

procedure TestFixableIssues;
var
  obj: TObject;
  list: TStringList;
begin
  { use-free-and-nil: will be fixed to FreeAndNil(obj) }
  obj := TObject.Create;
  obj.Free;
  
  { use-free-and-nil: will be fixed to FreeAndNil(list) }
  list := TStringList.Create;
  list.Free;
  
  { empty-begin-end: will be removed or commented }
  begin
  end;

  { upper-case-keywords: will be lowercased (if enabled) }
  BEGIN
    WriteLn('Test');
  END;
end;

end.
