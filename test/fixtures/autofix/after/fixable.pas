{*
  Auto-Fix Test Cases (After)
  ===========================
  Expected result after running pslint --fix on before/fixable.pas
*}

unit FixableIssues;

interface

implementation

procedure TestFixableIssues;
var
  obj: TObject;
  list: TStringList;
begin
  { use-free-and-nil: fixed }
  obj := TObject.Create;
  FreeAndNil(obj);
  
  { use-free-and-nil: fixed }
  list := TStringList.Create;
  FreeAndNil(list);
  
  { empty-begin-end: removed }
  { empty block removed }

  { upper-case-keywords: lowercased }
  begin
    WriteLn('Test');
  end;
end;

end.
