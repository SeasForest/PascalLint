{*
  PascalLint Test Fixtures
  ========================
  This file contains test cases for all 14 lint rules.
  Each section triggers specific rules for validation.
*}

unit TestAllRules;

interface

uses
  SysUtils, Classes;

type
  { RULE: pascal-case - should NOT trigger (correct naming) }
  TCorrectClassName = class
  public
    procedure DoSomething;
  end;

  { RULE: pascal-case - should trigger (incorrect naming) }
  myBadClass = class  // ⚠️ Should warn: not PascalCase
  public
    procedure test;   // ⚠️ Should warn: not PascalCase
  end;

implementation

{ ============================================
  RULE: no-with
  Category: Potential Error
  ============================================ }
procedure TestNoWith;
begin
  with Application do  // ❌ Should error: avoid with statement
    Run;
    
  with Form1 do        // ❌ Should error: avoid with statement
    Show;
end;

{ ============================================
  RULE: empty-begin-end
  Category: Best Practice
  ============================================ }
procedure TestEmptyBeginEnd;
begin
  // Empty block - should trigger
  begin              // ⚠️ Should warn: empty begin...end
  end;
  
  // Non-empty block - should NOT trigger
  begin
    WriteLn('Not empty');
  end;
end;

{ ============================================
  RULE: use-free-and-nil
  Category: Best Practice  
  ============================================ }
procedure TestUseFreeAndNil;
var
  List: TStringList;
  Obj: TObject;
begin
  List := TStringList.Create;
  List.Free;           // ⚠️ Should warn: use FreeAndNil(List) instead
  
  Obj := TObject.Create;
  Obj.Free;            // ⚠️ Should warn: use FreeAndNil(Obj) instead
  
  // Correct usage - should NOT trigger
  FreeAndNil(List);
end;

{ ============================================
  RULE: no-semicolon-before-else
  Category: Potential Error
  ============================================ }
procedure TestNoSemicolonBeforeElse;
var
  x: Integer;
begin
  x := 10; 
  
  // Incorrect - semicolon before else
  if x > 5 then
    WriteLn('Big');    // ❌ Semicolon here before else is error
  else
    WriteLn('Small');
    
  // Correct - no semicolon before else
  if x > 5 then
    WriteLn('Big')
  else
    WriteLn('Small');
end;

{ ============================================
  RULE: dangling-semicolon
  Category: Potential Error
  ============================================ }
procedure TestDanglingSemicolon;
var
  i: Integer;
begin
  // Dangling semicolon after then - creates empty statement
  if True then;        // ❌ Should error: dangling semicolon
    WriteLn('Always runs');
    
  // Dangling semicolon after do
  for i := 1 to 10 do; // ❌ Should error: dangling semicolon
    WriteLn(i);
    
  // Correct usage
  if True then
    WriteLn('Correct');
end;

{ ============================================
  RULE: no-empty-finally
  Category: Potential Error
  ============================================ }
procedure TestNoEmptyFinally;
begin
  try
    DoSomething;
  finally
    // Empty finally block
  end;                 // ⚠️ Should warn: empty finally
  
  // Correct usage
  try
    DoSomething;
  finally
    Cleanup;
  end;
end;

{ ============================================
  RULE: unreachable-code
  Category: Potential Error
  ============================================ }
procedure TestUnreachableCode;
begin
  WriteLn('Before exit');
  Exit;
  WriteLn('After exit'); // ❌ Should error: unreachable code
  
  // Another example
  raise Exception.Create('Error');
  Cleanup;               // ❌ Should error: unreachable code
end;

{ ============================================
  RULE: constructor-call-on-instance
  Category: Potential Error
  ============================================ }
procedure TestConstructorCallOnInstance;
var
  obj: TObject;
  FMyList: TStringList;
begin
  obj := TObject.Create;
  
  // Incorrect - calling Create on instance
  obj.Create;            // ❌ Should error: constructor on instance
  FMyList.Create;        // ❌ Should error: constructor on instance (F prefix)
  
  // Correct - calling Create on class
  obj := TObject.Create;
  FMyList := TStringList.Create;
end;

{ ============================================
  RULE: no-exit-in-finally
  Category: Potential Error
  ============================================ }
procedure TestNoExitInFinally;
begin
  try
    DoSomething;
  finally
    Exit;                // ❌ Should error: exit in finally
  end;
  
  try
    DoRisky;
  finally  
    raise Exception.Create('Bad'); // ❌ Should error: raise in finally
  end;
end;

{ ============================================
  RULE: check-assigned
  Category: Best Practice
  ============================================ }
procedure TestCheckAssigned;
var
  Obj: TObject;
begin
  Obj := GetSomeObject;
  Obj.Free;              // ℹ️ Should info: consider checking Assigned first
  
  // Better pattern
  if Assigned(Obj) then
    Obj.Free;
    
  // Or
  if Obj <> nil then
    FreeAndNil(Obj);
end;

{ ============================================
  RULE: pascal-case
  Category: Style
  ============================================ }
type
  TGoodClassName = class end;  // ✓ Correct
  goodclass = class end;       // ⚠️ Should warn: not PascalCase
  
procedure GoodProcedure;       // ✓ Correct
begin
end;

procedure badprocedure;        // ⚠️ Should warn: not PascalCase
begin
end;

{ ============================================
  RULE: camel-case (default: off)
  Category: Style
  ============================================ }
procedure TestCamelCase;
var
  goodVariable: Integer;       // ✓ Correct (if rule enabled)
  BadVariable: Integer;        // ⚠️ Would warn: not camelCase (if enabled)
  my_variable: Integer;        // ⚠️ Would warn: use camelCase (if enabled)
begin
end;

{ ============================================
  RULE: one-var-per-line
  Category: Style
  ============================================ }
procedure TestOneVarPerLine;
var
  a, b, c: Integer;            // ℹ️ Should info: multiple vars on one line
  x: Integer;                  // ✓ Correct: one var per line
  y: Integer;                  // ✓ Correct
begin
end;

{ ============================================
  RULE: upper-case-keywords (default: off)
  Category: Style
  ============================================ }
procedure TestUpperCaseKeywords;
BEGIN                          // ⚠️ Would warn: use lowercase 'begin' (if enabled)
  IF True THEN                 // ⚠️ Would warn: use lowercase 'if', 'then'
    WriteLn('Test');
END;

{ ============================================
  VALID CODE - Should NOT trigger any rules
  ============================================ }
procedure ValidCodeExample;
var
  myList: TStringList;
begin
  myList := TStringList.Create;
  try
    myList.Add('Hello');
    myList.Add('World');
    
    if myList.Count > 0 then
      WriteLn(myList[0])
    else
      WriteLn('Empty');
  finally
    FreeAndNil(myList);
  end;
end;

end.
