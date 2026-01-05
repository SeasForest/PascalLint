{*
  Valid Pascal Code - No Issues Expected
  ======================================
  This file should NOT trigger any lint rules.
  Used to verify no false positives.
*}

unit ValidCode;

interface

uses
  SysUtils, Classes;

type
  TMyClass = class
  private
    FName: string;
    FValue: Integer;
  public
    constructor Create(const AName: string);
    destructor Destroy; override;
    procedure DoSomething;
    function GetDescription: string;
  end;

implementation

constructor TMyClass.Create(const AName: string);
begin
  inherited Create;
  FName := AName;
  FValue := 0;
end;

destructor TMyClass.Destroy;
begin
  inherited;
end;

procedure TMyClass.DoSomething;
var
  tempList: TStringList;
begin
  tempList := TStringList.Create;
  try
    tempList.Add(FName);
    tempList.Add(IntToStr(FValue));
    
    if tempList.Count > 0 then
      WriteLn(tempList.Text)
    else
      WriteLn('Empty');
  finally
    FreeAndNil(tempList);
  end;
end;

function TMyClass.GetDescription: string;
begin
  Result := Format('%s = %d', [FName, FValue]);
end;

end.
