module String [];

let join : String -> List String -> String;
let join sep strings =
    strings |> List.intersperse sep |> List.fold "a \n  asd" append;


let append : String -> String -> String;
let append left right = todo;
