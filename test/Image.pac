module Image [Image, width, height];

import Task;

let Image = Image String Int Int;

let width : Image -> Int;
let width image =
    when image is
    | Image _ w _ -> w;;

let height : Image -> Int;
let height image =
    when image is
    | Image _ _ h -> h;;

let load : String -> Image;
let load = extern "load_image"
