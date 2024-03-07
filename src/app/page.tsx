'use client'
import BoardManager from "@/lib/circuit-maker";
import dynamic from "next/dynamic";

const Canvas = dynamic(() => import("@/components/canvas"), {
  ssr: false
})

const example = `define HalfSum
io 2 2
add XOR
add AND
connect Input#0 > XOR#0-0
connect Input#1 > XOR#0-1
connect Input#0 > AND#0-0
connect Input#1 > AND#0-1
connect XOR#0 > Output#0
connect AND#0 > Output#1
end
show HalfSum
run HalfSum
[ 0 1 ]
[ 1 1 ]
[ 0 0 ]
end`

export default function Home() {
  const boardManager = new BoardManager()
  const parsingResult = boardManager.parse(example)

  return (
    <main className="bg-white">
      <aside className="absolute w-full h-1/2 md:w-1/2 md:h-full p-8 bg-black/10 z-10 text-black">
        <div className="flex flex-col size-full">
          <h2>Input:</h2>
          <div className="size-full overflow-auto">
            {/* <textarea className="size-full p-2 bg-transparent resize-none text-nowrap">
              
            </textarea> */}
            { boardManager.getView().map(({ orderTree, runnersResults }, index) => <div key={index}>{ JSON.stringify({ orderTree, runnersResults }) }</div>) }
          </div>
        </div>
      </aside>
      <Canvas />
    </main>
  );
}
